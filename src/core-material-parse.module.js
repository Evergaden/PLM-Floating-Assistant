
  function extractPackaging(root) {
    const rows = getMaterialRows(root);
    const packageRows = rows
      .map((row, index) => ({ row, index, score: getPackageMaterialRowScore(row) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((item) => item.row);
    const printRows = rows.filter(isPrintMaterialRow);
    // Keep a real paper box first. If there is no box, a self-standing
    // printed bag is still the outer package and fills the package field.
    const packageRow = packageRows.find((row) => isPaperBoxMaterialText(row))
      || packageRows.find((row) => isPrintedBagMaterialText(row))
      || packageRows[0]
      || '';
    const packageUnitIssue = detectMaterialDimensionUnitIssue(packageRow);
    const packageDim = packageUnitIssue ? '' : extractDimensionString(packageRow);
    const packageRawDim = packageUnitIssue ? packageUnitIssue.raw : '';
    const packageNums = packageUnitIssue ? null : parseDimension(packageDim, 3);
    let packageName = getPackageMaterialKind(extractMaterialName(packageRow)) || getMaterialDisplayName(packageRow, /(\u7eb8\u76d2|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/);
    if (packageNums && packageNums.length >= 5 && !/\u591a\u9875/.test(packageName + packageRow)) {
      packageName = appendChineseRemark(packageName, '\u591a\u9875');
    }
    const printUnitIssues = [];
    const printItems = printRows.map((row) => {
      const unitIssue = detectMaterialDimensionUnitIssue(row);
      if (unitIssue) {
        printUnitIssues.push(unitIssue);
        return unitIssue.raw;
      }
      const dims = extractNamedDimensionStrings(row);
      if (!dims.length) return '';
      return dims.join('\uff1b');
    }).filter(Boolean);

    return {
      accessories: extractDomAccessories(root),
      packageSizeText: packageDim || packageRawDim,
      packageSizeLabel: packageName || '',
      packageCode: extractMaterialCode(packageRow),
      packageNums,
      isPrintedBagOuterPackage: Boolean(packageRow && !isPaperBoxMaterialText(packageRow) && isPrintedBagMaterialText(packageRow)),
      hasInnerCard: /\u5185\u5361/.test(packageRow),
      printSizeText: printItems.join('\uff1b'),
      printSizeLabel: getCombinedPrintLabel(printRows),
      printCode: printRows.map(extractMaterialCode).filter(Boolean).join('\uff1b'),
      materialDimensionUnitIssues: {
        package: packageUnitIssue,
        print: printUnitIssues[0] || null,
      },
      isTubePrintMaterial: printRows.some(isTubePrintRow),
      printRawText: printRows.join('\uff1b').slice(0, 1000),
      netContent: extractNetContentFromMaterial(packageRow) || extractNetContentFromMaterial(printRows[0] || ''),
    };
  }

  function isPrintMaterialRow(row) {
    const text = String(row || '');
    if (/说明书|使用说明/.test(text)) return false;
    const excludedPackaging = /(\u8bf4\u660e\u4e66|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/.test(text);
    const hasExplicitPrintSize = /(?:\u5370\u5237|\u4e1d\u5370)\s*[:\uff1a]?\s*(?:\u5c3a\u5bf8\s*[:\uff1a]?\s*)?(?:\u957f|\u5bbd|\u9ad8)?\s*\d/i.test(text) && hasPrintDimensionText(text);
    // PLM categories are sometimes entered as "printed bag" even when the material description clearly identifies a tube.
    // A real printed bag with an explicitly labeled print size is both packaging and a printable material.
    if (excludedPackaging && !isTubePrintRow(text) && !hasExplicitPrintSize) return false;
    return (/\u5305\u6750/.test(text) && /(\u6807\u7b7e|\u4e1d\u5370|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6)/.test(text))
      || (/\u5305\u6750/.test(text) && /(?:\u5370\u5237|\u4e1d\u5370)/.test(text) && hasPrintDimensionText(text))
      || (/(?:\u5370\u5237|\u4e1d\u5370)(?:\u74f6|\u7ba1|\u8f6f\u7ba1|\u4e73\u6db2\u74f6|\u5c3a\u5bf8)/.test(text) && hasPrintDimensionText(text));
  }

  function getProjectField(text, fieldName) {
    const escaped = escapeRegExp(fieldName);
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5e73\u53f0|\u4ea7\u54c1\u540d\u79f0|\u5173\u952e\u8bcd|\u8bbe\u8ba1\u7c7b\u578b|\u662f\u5426\u7206\u6b3e|\u662f\u5426\u4ee3\u53d1|\u5f00\u53d1\u5206\u914d|\u54c1\u724c\u7c7b\u522b|\u5f00\u53d1\u4e3b\u7ba1|\u8bbe\u8ba1\u5206\u914d|\u5f00\u53d1\u5206\u914d\u65f6\u95f4|\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4|\u521b\u5efa\u65f6\u95f4|\u6700\u540e\u4fee\u6539\u65f6\u95f4|\u9879\u76ee\u4fe1\u606f|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '[:\uff1a]\\s*([\\s\\S]{0,80})'));
    if (!match) return '';
    const value = compactText(match[1]).split(stop)[0].trim();
    return fieldName === '\u54c1\u724c'
      ? value.split(/(?:\u54c1\u7c7b|\u7c7b\u76ee|\u5546\u54c1\u7c7b\u76ee|\u4ea7\u54c1\u7c7b\u76ee)\s*[:\uff1a]?/)[0].trim()
      : value;
  }

  function getProjectLooseField(text, fieldName) {
    const escaped = escapeRegExp(fieldName);
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5e73\u53f0|\u4ea7\u54c1\u540d\u79f0|\u5173\u952e\u8bcd|\u8bbe\u8ba1\u7c7b\u578b|\u662f\u5426\u7206\u6b3e|\u662f\u5426\u4ee3\u53d1|\u5f00\u53d1\u5206\u914d|\u54c1\u724c\u7c7b\u522b|\u5f00\u53d1\u4e3b\u7ba1|\u8bbe\u8ba1\u5206\u914d|\u5176\u4ed6\u4fe1\u606f|\u5ba1\u6279\u72b6\u6001|\u9879\u76ee\u72b6\u6001|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '\\s*[:\uff1a]?\\s*([\\s\\S]{0,120})'));
    if (!match) return '';
    return compactText(match[1]).split(stop)[0].trim();
  }

  function extractDeveloperText(text) {
    const source = compactText(text || '');
    const match = source.match(/\u5f00\u53d1\u4eba\u5458\s*[:\uff1a]?\s*([\s\S]{0,80})/);
    if (!match) return '';
    return compactText(match[1]).split(/\u5f00\u53d1\u4e3b\u7ba1|\u5f00\u53d1\u5efa\u8bae|\u5f00\u53d1\u5206\u914d|\u8bbe\u8ba1\u4eba\u5458|\u9879\u76ee\u8d1f\u8d23\u4eba|\u9879\u76ee\u72b6\u6001/)[0].trim();
  }

  function extractDeveloperName(value) {
    const source = compactText(value || '').replace(/^(?:\u5f00\u53d1\u4eba\u5458|\u5f00\u53d1)\s*[:\uff1a]?\s*/, '').trim();
    if (!source) return '';
    const match = source.match(/^([\u4e00-\u9fa5A-Za-z ._-]+?)(?=\s+(?:\u5f00\u53d1|\u4e3b\u7ba1|\u7ecf\u7406|\u4e13\u5458)|\s*\||$)/);
    return compactText(match ? match[1] : source.split(/[|｜/\\]/)[0]);
  }

  function getMaterialDimensionIssueDeveloper(data) {
    return extractDeveloperName(data && data.developerName)
      || extractDeveloperName(data && data.developerText)
      || extractDeveloperName(data && data.projectOwnerName)
      || '负责人';
  }

  function extractProjectStatus(text) {
    const source = compactText(text || '');
    const statuses = ['\u5f85\u5ba1\u6838', '\u8fdb\u884c\u4e2d', '\u5df2\u62d2\u7edd', '\u5df2\u4f5c\u5e9f', '\u5df2\u5b8c\u6210'];
    const labeled = source.match(/\u9879\u76ee\u72b6\u6001\s*[:\uff1a]?\s*(\u5f85\u5ba1\u6838|\u8fdb\u884c\u4e2d|\u5df2\u62d2\u7edd|\u5df2\u4f5c\u5e9f|\u5df2\u5b8c\u6210)/);
    if (labeled) return labeled[1];
    return statuses.find((status) => source.includes(status)) || '';
  }

  function extractReferenceUrl(text) {
    const match = String(text || '').match(/\u5bf9\u6807\u94fe\u63a5\s*[:\uff1a]?\s*(https?:\/\/[^\s]+)/i);
    return match ? match[1].trim() : '';
  }

  function extractArtPriority(text) {
    const source = compactText(text || '');
    const match = source.match(/\bP[0-9]\s*[-\uff0d]\s*[\u4e00-\u9fa5A-Za-z0-9]{1,8}/);
    return match ? match[0].replace(/\s+/g, '') : '';
  }

  function getMaterialDisplayName(row, keywordPattern) {
    const name = extractMaterialName(row);
    if (!name) return '';
    const match = name.match(keywordPattern);
    return match ? name.slice(match.index).trim() : name.trim();
  }

  // Material names often append the product name after the packaging type.
  // Keep only the recognized packaging kind so unrelated text is not shown as a box remark.
  function getPackageMaterialKind(value) {
    const text = compactText(value);
    const match = text.match(/(纸盒|彩盒|纸箱|包装盒|外盒|印刷自立袋|自立印刷袋|自立袋|印刷袋|包装袋|铝箔袋|自封袋|袋子)/);
    return match ? match[1] : '';
  }

  function isPaperBoxMaterialText(value) {
    return /(?:纸盒|彩盒|纸箱|包装盒|外盒)/.test(compactText(value));
  }

  function isPrintedBagMaterialText(value) {
    return /(?:印刷自立袋|自立印刷袋|自立袋|印刷袋|包装袋|铝箔袋|自封袋|软袋|袋子|袋\/膜类)/.test(compactText(value));
  }

  function cleanPackageDisplayLabel(value) {
    const text = compactText(value);
    if (!text) return '';
    const kind = getPackageMaterialKind(text);
    if (!kind) return text;
    return kind + (/多页/.test(text) ? '（多页）' : '');
  }

  function extractMaterialCode(row) {
    const match = String(row || '').match(/\b(MTL\d+)\b/);
    return match ? match[1] : '';
  }

  function getCombinedPrintLabel(rows) {
    const labels = rows.map((row) => cleanPrintLabel(getMaterialDisplayName(row, /(\u6807\u7b7e|\u4e1d\u5370|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u5370\u5237)/) || extractPrintLabelFallback(row))).filter(Boolean);
    return labels.filter((label, index) => labels.indexOf(label) === index).join('\uff1b');
  }

  function extractPrintLabelFallback(row) {
    const match = String(row || '').match(/(\u6807\u7b7e|\u4e1d\u5370|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u5370\u5237)/);
    return match ? match[1] : '';
  }

  function cleanPrintLabel(label) {
    const text = compactText(label);
    if (/\u5370\u5237(?:\u4e73\u6db2\u74f6|\u8f6f\u7ba1|\u7ba1|\u74f6)/.test(text) || (/\u8f6f\u7ba1/.test(text) && /\u5370\u5237/.test(text))) return '\u5370\u5237';
    if (/\u4e1d\u5370(?:\u4e73\u6db2\u74f6|\u8f6f\u7ba1|\u7ba1|\u74f6)/.test(text)) return '\u4e1d\u5370';
    return text
      .replace(/\uff08\u4ef7\u683c\u5305\u542b\u4e8e\u534a\u6210\u54c1\uff09/g, '')
      .replace(/[\uff08(]\s*\u4ef7\u683c\u5305\u542b[\u5728\u4e8e]\s*\u534a\u6210\u54c1\s*[\uff09)]/g, '')
      .replace(/\uff08\u8fd4\u5de5\s*\u4e00\u6b21\u6027\uff09/g, '')
      .replace(/\uff08\u888b\u542b\u6599\uff09/g, '')
      .trim();
  }

  function extractMaterialName(row) {
    const source = compactText(row || '');
    const match = source.match(/(?:MTL\d+\s+){1,2}(.+?)\s+\u5305\u6750\s*[-\uff0d\u2013\u2014\u2212]/i);
    if (match) return match[1].trim();
    const category = source.match(/\u5305\u6750\s*[-\uff0d\u2013\u2014\u2212]\s*/);
    if (!category) return '';
    const beforeCategory = source.slice(0, category.index).trim();
    const codes = Array.from(beforeCategory.matchAll(/MTL\d+/gi));
    if (!codes.length) return '';
    const lastCode = codes[codes.length - 1];
    return beforeCategory.slice((lastCode.index || 0) + lastCode[0].length).trim();
  }

  function extractNamedDimensionStrings(text) {
    const source = String(text || '');
    if (isTubePrintRow(source)) {
      const tubeDim = extractPrintDimensionString(source);
      return tubeDim ? [tubeDim] : [];
    }
    const axisDim = extractAxisDimensionString(source);
    const pattern = /(?:([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,16})[:\uff1a]\s*)?(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm))/ig;
    const items = [];
    if (axisDim) items.push(axisDim);
    let match;
    while ((match = pattern.exec(source))) {
      let name = match[1] ? match[1].trim() : '';
      if (!name) {
        const before = source.slice(Math.max(0, match.index - 12), match.index);
        const implicit = before.match(/([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,8})$/);
        name = implicit ? implicit[1].trim() : '';
      }
      const dim = normalizeDimensionText(match[2]);
      if (!dim) continue;
      if (items.includes(dim)) continue;
      items.push(name && !isGenericDimensionName(name) ? name + '\uff1a' + dim : dim);
    }
    return items;
  }

  function hasPrintDimensionText(text) {
    const source = String(text || '');
    return /\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm)/i.test(source)
      || !!extractAxisDimensionString(source)
      || !!detectMaterialDimensionUnitIssue(source);
  }

  function extractPrintDimensionString(text) {
    const source = String(text || '');
    const axisDim = extractAxisDimensionString(source);
    if (axisDim) return axisDim;
    const match = source.match(/(?:\u5370\u5237|\u4e1d\u5370)(?:\u5c3a\u5bf8|\u89c4\u683c)?[^\d]{0,12}(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm)?)/i);
    return match ? normalizeDimensionText(match[1]) : '';
  }

  function extractAxisDimensionString(text) {
    const source = String(text || '');
    const match = source.match(/(?:\u5370\u5237|\u4e1d\u5370)(?:\u5c3a\u5bf8|\u89c4\u683c)?[^\d]{0,12}?(\u957f|\u5bbd|\u9ad8)?\s*(\d+(?:\.\d+)?)\s*(cm|mm)?\s*(?:[xX\u00d7*]\s*)?(\u957f|\u5bbd|\u9ad8)\s*(\d+(?:\.\d+)?)\s*(cm|mm)?/i);
    if (!match) return '';
    const values = [
      { axis: match[1] || '', value: Number(match[2]) },
      { axis: match[4] || '', value: Number(match[5]) },
    ];
    const width = values.find((item) => item.axis === '\u5bbd');
    const height = values.find((item) => item.axis === '\u9ad8');
    const length = values.find((item) => item.axis === '\u957f');
    const orderedValues = width && height
      ? [width.value, height.value]
      : length && height
      ? [length.value, height.value]
      : length && width
      ? [length.value, width.value]
      : values.map((item) => item.value);
    const unit = (match[6] || match[3] || 'cm').toLowerCase();
    return normalizeDimensionParts(orderedValues, unit);
  }

  function isGenericDimensionName(name) {
    return /^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)$/.test(String(name || '').trim());
  }

  function isTubePrintRow(row) {
    const text = String(row || '');
    return /\u5370\u5237(?:\u8f6f\u7ba1|\u7ba1|\u74f6|\u4e73\u6db2\u74f6)/.test(text) || (hasStrongTubeMaterialFeatures(text) && /\u5370\u5237(?:\u5c3a\u5bf8)?/.test(text));
  }

  function hasStrongTubeMaterialFeatures(text) {
    const source = String(text || '');
    if (/\u8f6f\u7ba1|\u767d\u7ba1|\u9ed1\u7ba1|(?:PE|pe)[^\s,，;；]{0,4}\u7ba1/.test(source)) return true;
    const structuralMarkers = ['\u7ba1\u5f84', '\u7ba1\u8eab', '\u5c01\u5c3e', '\u76d6\u5b50\u9ad8\u5ea6', '\u603b\u9ad8\u5ea6'].filter((marker) => source.includes(marker));
    return structuralMarkers.length >= 2;
  }

  function isTubePrintData(data) {
    // The segmented size is the authoritative signal for tube-specific fields.
    // Material labels alone are not enough: printed bags and other print materials
    // can contain the same words but must not show a tail-seal length.
    return Boolean(String(data && data.tubeSegmentText || '').trim());
  }

  function findTubeSizeSpec(text, fields) {
    const diameter = fields && fields.diameter ? fields.diameter : 0;
    const body = fields && fields.body ? fields.body : 0;
    if (!diameter || !body) return null;
    let spec = diameter && body ? TUBE_SIZE_SPECS.find((item) => item.diameter === diameter && item.body === body) : null;
    let rule = null;
    if (!spec && diameter && body) {
      rule = TUBE_SIZE_RULES.find((item) => item.diameter === diameter && item.bodies.includes(body));
      if (rule) spec = buildTubeSpecFromRule(rule, body);
    }
    if (!spec) return null;
    const tailSeal = (Number(spec.widths[1]) || 0) + (Number(spec.widths[2]) || 0);
    return {
      diameter,
      body,
      key: spec.key || (diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab'),
      widths: spec.widths.slice(),
      printSizeText: formatTubeSpecPrintSize(spec),
      segmentText: spec.widths.map(formatCmSegment).join('-') + 'cm',
      tailSealText: formatSingleDimension(tailSeal),
    };
  }

  function buildTubeSpecFromRule(rule, body) {
    const size = getTubeRulePrintSize(rule, body);
    return {
      key: rule.diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab',
      diameter: rule.diameter,
      body,
      widths: rule.widths.slice(),
      width: size.width,
      height: size.height,
    };
  }

  function extractTubeFields(root) {
    if (!root) return { diameter: 0, body: 0, text: '' };
    const fullText = getVisibleText(root);
    const diameter = normalizeTubeMeasureText(getFormValueByLooseLabel('\u7ba1\u5f84', root)) || extractTubeMeasure(fullText, '\u7ba1\u5f84');
    const body = normalizeTubeMeasureText(getFormValueByLooseLabel('\u7ba1\u8eab', root)) || extractTubeMeasure(fullText, '\u7ba1\u8eab');
    const parts = [];
    if (diameter) parts.push('\u7ba1\u5f84 ' + diameter + 'mm');
    if (body) parts.push('\u7ba1\u8eab ' + body + 'mm');
    return { diameter, body, text: parts.join(' ') };
  }

  function extractTubePrintDimensionNums(text) {
    const source = String(text || '');
    const labeled = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,20}(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (labeled) {
      const unit = labeled[3].toLowerCase();
      return [normalizeDimensionUnitNumber(labeled[1], unit), normalizeDimensionUnitNumber(labeled[2], unit)];
    }
    const dimension = source.match(/(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (!dimension) return null;
    const unit = dimension[3].toLowerCase();
    return [normalizeDimensionUnitNumber(dimension[1], unit), normalizeDimensionUnitNumber(dimension[2], unit)];
  }

  function getTubeRulePrintSize(rule, body) {
    const width = rule.widths.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const height = Math.max(0, (Number(body) || 0) / 10 - 0.1);
    return { width, height };
  }

  function formatTubeSpecPrintSize(spec) {
    if (!spec || !Number.isFinite(Number(spec.width)) || !Number.isFinite(Number(spec.height))) return '';
    return trimNumber(Number(spec.width)) + 'x' + trimNumber(Number(spec.height)) + 'cm';
  }

  function normalizeDimensionUnitNumber(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return String(unit || '').toLowerCase() === 'mm' ? num / 10 : num;
  }

  function extractTubeMeasure(text, label) {
    const source = String(text || '');
    const escaped = escapeRegExp(label);
    const labelPair = source.match(/\u7ba1\u5f84\s+\u7ba1\u8eab\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
    if (labelPair) return normalizeTubeMeasureValue(label === '\u7ba1\u5f84' ? labelPair[1] : labelPair[2], '');
    const inlinePair = source.match(/\u7ba1\u5f84[^\d]{0,12}(\d+(?:\.\d+)?)\s*(mm|cm)?[^\u7ba1\d]{0,20}\u7ba1\u8eab[^\d]{0,12}(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
    if (inlinePair) {
      const diameterUnit = inlinePair[2] || inlinePair[4] || '';
      const bodyUnit = inlinePair[4] || inlinePair[2] || '';
      return label === '\u7ba1\u5f84'
        ? normalizeTubeMeasureValue(inlinePair[1], diameterUnit)
        : normalizeTubeMeasureValue(inlinePair[3], bodyUnit);
    }
    const labelIndex = source.search(new RegExp(escaped, 'i'));
    const scope = labelIndex >= 0 ? source.slice(labelIndex, labelIndex + 120) : source;
    const direct = scope.match(new RegExp(escaped + '[^\\d]{0,24}(\\d+(?:\\.\\d+)?)\\s*(mm|cm)?', 'i'));
    if (direct) return normalizeTubeMeasureValue(direct[1], direct[2]);
    const tableLike = scope.match(/(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (tableLike) return normalizeTubeMeasureValue(tableLike[1], tableLike[2]);
    return 0;
  }

  function normalizeTubeMeasureText(text) {
    const match = String(text || '').match(/(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
    return match ? normalizeTubeMeasureValue(match[1], match[2]) : 0;
  }

  function normalizeTubeMeasureValue(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    const normalized = String(unit || '').toLowerCase() === 'cm' ? num * 10 : num;
    return Math.round(normalized);
  }

  function formatCmSegment(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    const text = String(number);
    return text.includes('.') ? text : text + '.0';
  }

  function getMaterialRows(root) {
    return Array.from(root.querySelectorAll('tr, .ant-table-row, [role="row"]'))
      .filter(isVisibleElement)
      .map((el) => compactText(el.innerText || el.textContent || ''))
      .flatMap(splitCombinedMaterialRow)
      .filter((text, idx, arr) => text && arr.indexOf(text) === idx);
  }

  function splitCombinedMaterialRow(text) {
    const source = String(text || '');
    const matches = Array.from(source.matchAll(/\bMTL\d+\b/gi));
    if (matches.length < 2) return [source];
    const starts = [];
    let previousCode = '';
    matches.forEach((match) => {
      const code = String(match[0] || '').toUpperCase();
      if (code !== previousCode) starts.push(Number(match.index) || 0);
      previousCode = code;
    });
    if (starts.length < 2) return [source];
    return starts.map((start, index) => source.slice(start, starts[index + 1] || source.length).trim()).filter(Boolean);
  }

  function extractNetContentFromMaterial(row) {
    const tabletMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*\u7247\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (tabletMatch) return trimNumber(Number(tabletMatch[1])) + 'TABLETS';
    const pcsMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*(PCS?)\s*(?:\/\s*(?:\u4ef6|\u76d2|\u74f6|\u888b))?/i);
    if (pcsMatch) return trimNumber(Number(pcsMatch[1])) + pcsMatch[2].toUpperCase();
    const pairMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*\u5957\s*\/\s*\u76d2/i);
    if (pairMatch) {
      const count = Number(pairMatch[1]);
      return trimNumber(count) + (count === 1 ? 'PAIR' : 'PAIRS');
    }
    const match = String(row || '').match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|mL|l|L|\u514b|\u5343\u514b|\u6beb\u5347|\u5347)\s*\/\s*\u76d2/i);
    if (!match) return '';
    const unitMap = {
      '\u514b': 'g',
      '\u5343\u514b': 'kg',
      '\u6beb\u5347': 'ml',
      '\u5347': 'L',
    };
    const unit = unitMap[match[2]] || match[2];
    return trimNumber(Number(match[1])) + unit;
  }

  function extractDimensionString(text) {
    const matches = String(text || '').match(/\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*(?:(?:cm|mm))?){1,4}\s*(?:cm|mm)/ig);
    if (!matches || !matches.length) return '';
    return normalizeDimensionText(matches[matches.length - 1]);
  }

  function normalizeDimensionText(text) {
    const source = String(text || '');
    const nums = source.match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return '';
    const unitMatch = source.match(/(mm|cm)\s*$/i) || source.match(/\b(mm|cm)\b/i);
    return normalizeDimensionParts(nums, unitMatch ? unitMatch[1] : 'cm');
  }

  function normalizeDimensionParts(nums, unit) {
    const divisor = String(unit || '').toLowerCase() === 'mm' ? 10 : 1;
    return nums.map((n) => trimNumber(Number(n) / divisor)).join('x') + 'cm';
  }

  function detectMaterialDimensionUnitIssue(text) {
    const source = String(text || '');
    const match = source.match(/(\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){1,4}\s*m(?!m|l))/i);
    if (match) return { unit: 'm', raw: compactText(match[1]) };
    const meterMatches = Array.from(source.matchAll(/\d+(?:\.\d+)?\s*m(?!m|l)/ig));
    if (meterMatches.length >= 2) {
      const start = Number(meterMatches[0].index) || 0;
      const end = (Number(meterMatches[meterMatches.length - 1].index) || start) + meterMatches[meterMatches.length - 1][0].length;
      return { unit: 'm', raw: compactText(source.slice(start, end)) };
    }
    return null;
  }

  function normalizeMaterialDimensionUnitIssue(value) {
    if (!value) return null;
    if (typeof value === 'string') return detectMaterialDimensionUnitIssue(value);
    if (String(value.unit || '').toLowerCase() !== 'm') return null;
    const raw = compactText(value.raw || '');
    return { unit: 'm', raw: raw || 'm' };
  }

  function normalizeMaterialDimensionUnitIssues(value, data) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      package: normalizeMaterialDimensionUnitIssue(source.package) || detectMaterialDimensionUnitIssue(data && data.packageSizeText),
      print: normalizeMaterialDimensionUnitIssue(source.print) || detectMaterialDimensionUnitIssue(data && data.printSizeText),
    };
  }

  function getMaterialDimensionUnitIssue(data, kind) {
    const issues = normalizeMaterialDimensionUnitIssues(data && data.materialDimensionUnitIssues, data);
    return issues[kind] || null;
  }

  function extractOuterPackage(root) {
    const nums = [
      getFormValueByLabel('\u957f\uff08\u5916\u5305\u88c5\uff09', root),
      getFormValueByLabel('\u5bbd\uff08\u5916\u5305\u88c5\uff09', root),
      getFormValueByLabel('\u9ad8\uff08\u5916\u5305\u88c5\uff09', root),
    ].map(firstNumber);
    return nums.every((n) => Number.isFinite(n)) ? { packageNums: nums } : { packageNums: null };
  }

  function getPackageMaterialRowScore(row) {
    const text = String(row || '');
    if (!/\u5305\u6750/.test(text)) return 0;
    const name = extractMaterialName(text);
    const bagPattern = /(?:\u5370\u5237\u81ea\u7acb\u888b|\u81ea\u7acb\u5370\u5237\u888b|\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u8f6f\u888b|\u888b\u5b50|\u888b\/\u819c\u7c7b)/;
    let score = 0;
    if (isPaperBoxMaterialText(name)) score += 140;
    else if (isPrintedBagMaterialText(name)) score += 120;
    if (/\u5305\u6750\s*-\s*\u7eb8\u76d2/.test(text)) score += 80;
    else if (new RegExp('\\u5305\\u6750\\s*-\\s*[^;]{0,36}' + bagPattern.source).test(text)) score += 35;
    if (/\u767d\u5361|\u9ed1\u5361|\u725b\u76ae\u7eb8|\u74e6\u695e/.test(text)) score += 10;
    if (/\u74f6|\u65cb\u76d6|\u6cf5\u5934|\u55b7\u5934|\u7f50|\u8f6f\u7ba1|\u6ef4\u7ba1|\u5237\u5934|\u76d6\u5b50/.test(name)) score -= 180;
    return score;
  }

  function extractInnerPackage(root) {
    const labelGroups = [
      ['\u957f（\u5185\u5305\u6750）', '\u957f（\u4ea7\u54c1）'],
      ['\u5bbd（\u5185\u5305\u6750）', '\u5bbd（\u4ea7\u54c1）'],
      ['\u9ad8（\u5185\u5305\u6750）', '\u9ad8（\u4ea7\u54c1）'],
    ];
    const nums = labelGroups.map((labels) => {
      const value = labels.map((label) => getFormValueByLabel(label, root)).find(Boolean) || '';
      return firstNumber(value);
    });
    return nums.every((value) => Number.isFinite(value) && value > 0) ? { productNums: nums } : { productNums: null };
  }

  function emptyPackaging() {
    return { packageSizeText: '', packageSizeLabel: '', packageCode: '', packageNums: null, isPrintedBagOuterPackage: false, hasInnerCard: false, printSizeText: '', printSizeLabel: '', printCode: '', printRawText: '', materialDimensionUnitIssues: { package: null, print: null }, netContent: '', infringementImageUrls: [], infringementImageUrl: '', infringementImageSource: '', infringementCopywriting: '', apiFieldStates: {} };
  }

  function extractFoodSemiFinished(root) {
    const row = getMaterialRows(root).find((text) => /\u534a\u6210\u54c1/.test(text) && /\u98df\u54c1\u7c7b/.test(text) && /(\u80f6\u56ca|\u8f6f\u7cd6)/.test(text)) || '';
    if (!row) return emptyFoodSemiFinished();
    const dim = extractDimensionString(row);
    const nums = parseDimension(dim, 2);
    const productNums = nums && nums.length >= 2 ? [nums[0], nums[0], nums[1]] : null;
    const count = (row.match(/(\d+(?:\.\d+)?)\s*\u7c92/) || [])[1];
    const type = /软糖/.test(row) ? 'GUMMIES' : (/软胶囊/.test(row) ? 'SOFTGELS' : 'CAPSULES');
    return {
      productNums,
      netContent: count ? trimNumber(Number(count)) + type : '',
    };
  }

  function emptyFoodSemiFinished() {
    return { productNums: null, netContent: '' };
  }

  function getBestNetContent(root) {
    return extractSpecModelNetContent(root);
  }

  function normalizeNetContentValue(value) {
    const text = compactText(value);
    if (!text) return '';
    const pcMatch = text.match(/(\d+(?:\.\d+)?)\s*(PCS?)\s*(?:\/\s*(?:\u4ef6|\u76d2|\u74f6|\u888b))?/i);
    if (pcMatch) return trimNumber(Number(pcMatch[1])) + pcMatch[2].toUpperCase();
    if (/^\d+(?:\.\d+)?\s*(CAPSULES|GUMMIES|TABLETS|PAIR|PAIRS|PC)$/i.test(text)) return text.replace(/\s+/g, '').toUpperCase();
    const capsuleMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\u7c92|\u80f6\u56ca)\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (capsuleMatch) return trimNumber(Number(capsuleMatch[1])) + 'CAPSULES';
    const tabletMatch = text.match(/(\d+(?:\.\d+)?)\s*\u7247\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (tabletMatch) return trimNumber(Number(tabletMatch[1])) + 'TABLETS';
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|\u514b|\u5343\u514b|\u6beb\u5347|\u5347)\s*(?:\/\s*[\u4e00-\u9fa5A-Za-z]+)?/i);
    if (weightMatch) {
      return formatNetContentAmount(weightMatch[1], weightMatch[2]);
    }
    return '';
  }

  function productNameDerivedNetContent(productName, netContent, specificationText) {
    const name = normalizeProductNameValue(productName);
    if (!/软胶囊/.test(name)) return '';
    const source = [name, netContent, specificationText].map((value) => compactText(value)).filter(Boolean).join(' ');
    const match = source.match(/(\d+(?:\.\d+)?)\s*(?:粒|SOFTGELS?|CAPSULES?)/i);
    return match ? trimNumber(Number(match[1])) + 'SOFTGELS' : '';
  }

  function extractSpecModelNetContent(root) {
    const lines = getVisibleText(root).split('\n').map((line) => compactText(line)).filter(Boolean);
    for (let i = 0; i < lines.length; i += 1) {
      if (!/\u89c4\u683c\u578b\u53f7/.test(lines[i])) continue;
      const sameLine = lines[i].replace(/\u89c4\u683c\u578b\u53f7[:\uff1a]?/, '').trim();
      const candidates = [sameLine, lines[i + 1] || ''].filter(Boolean);
      for (const candidate of candidates) {
        const normalized = normalizeNetContentValue(candidate);
        if (normalized) return normalized;
      }
    }
    return '';
  }

  function formatNetContentAmount(amount, unitRaw) {
    const unitMap = { '\u514b': 'g', '\u5343\u514b': 'kg', '\u6beb\u5347': 'ml', '\u5347': 'L' };
    return trimNumber(Number(amount)) + (unitMap[unitRaw] || unitRaw);
  }

  function productNumsFromPackage(packageNums, hasInnerCard) {
    if (!Array.isArray(packageNums) || packageNums.length < 3) return null;
    const delta = hasInnerCard ? INNER_CARD_DELTA_CM : NORMAL_DELTA_CM;
    return packageNums.slice(0, 3).map((n) => Math.max(0, n - delta));
  }

  function formatDimensionPart(nums, index) {
    if (!Array.isArray(nums) || !Number.isFinite(nums[index])) return '';
    return formatSingleDimension(nums[index]);
  }

  function formatSingleDimension(value) {
    if (!Number.isFinite(Number(value))) return '';
    const cm = trimNumber(Number(value));
    const inch = trimNumber(Number(value) * CM_TO_INCH);
    return cm + 'cm/' + inch + 'inch';
  }

  function getFormValueByLabel(fieldLabel, root) {
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => normalizeFieldLabel(el.textContent) === fieldLabel);
    for (const labelEl of labels) {
      const item = labelEl.closest('.ant-form-item') || labelEl.parentElement;
      if (!item || !isVisibleElement(item)) continue;
      const controlValue = getVisibleFormControlValue(item);
      if (controlValue) return controlValue;
      const text = compactText(item.innerText || item.textContent || '');
      const value = text.replace(new RegExp('^' + escapeRegExp(fieldLabel) + '\\*?\\s*'), '').trim();
      const cleaned = cleanValue(value);
      if (cleaned) return cleaned;
    }
    return '';
  }

  function getFormValueByLooseLabel(fieldLabel, root) {
    const expected = normalizeLooseFieldLabel(fieldLabel);
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => normalizeLooseFieldLabel(el.textContent) === expected);
    for (const labelEl of labels) {
      const item = labelEl.closest('.ant-form-item') || labelEl.closest('.ant-descriptions-item') || labelEl.parentElement;
      if (!item || !isVisibleElement(item)) continue;
      const controlValue = getVisibleFormControlValue(item);
      if (controlValue) return controlValue;
      const text = compactText(item.innerText || item.textContent || '');
      const value = text
        .replace(new RegExp('^' + escapeRegExp(normalizeFieldLabel(labelEl.textContent)) + '\\*?\\s*'), '')
        .replace(new RegExp('^' + escapeRegExp(fieldLabel) + '(?:\\s*[\\uff08(][^\\uff09)]*[\\uff09)])?\\*?\\s*'), '')
        .trim();
      const cleaned = cleanValue(value);
      if (cleaned) return cleaned;
    }
    return getFormValueByLabel(fieldLabel, root);
  }

  function getVisibleFormControlValue(item) {
    if (!item) return '';
    const control = Array.from(item.querySelectorAll('input, textarea, select'))
      .filter(isVisibleElement)
      .find((element) => cleanValue(element.value || element.getAttribute('value') || ''));
    if (control) return cleanValue(control.value || control.getAttribute('value') || '');
    const valueNode = Array.from(item.querySelectorAll('.ant-select-selection-item, .ant-input-number-input, .ant-descriptions-item-content'))
      .filter(isVisibleElement)
      .find((element) => cleanValue(element.innerText || element.textContent || ''));
    return valueNode ? cleanValue(valueNode.innerText || valueNode.textContent || '') : '';
  }

  function normalizeLooseFieldLabel(text) {
    return normalizeFieldLabel(text)
      .replace(/\*?(?:\u70b9\u51fb)?\u67e5\u770b\u98ce\u9669$/g, '')
      .replace(/[\uff08(]\s*(?:mm|cm|kg|g|ml|l|\u6beb\u7c73|\u5398\u7c73|\u5343\u514b|\u514b|\u6beb\u5347|\u5347)\s*[\uff09)]/ig, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function normalizeWeight(raw) {
    if (!raw) return '';
    const match = String(raw).match(/(\d+(?:\.\d+)?)\s*(kg|\u5343\u514b|g|\u514b)/i);
    if (!match) return cleanValue(raw);
    const unit = /kg|\u5343\u514b/i.test(match[2]) ? 'kg' : 'g';
    return trimNumber(Number(match[1])) + unit;
  }

  function getGrossWeightValue(root) {
    const raw = getFormValueByLooseLabel('\u6bdb\u91cd', root);
    if (!raw) return '';
    if (/(?:kg|\u5343\u514b|g|\u514b)/i.test(raw)) return normalizeWeight(raw);
    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      const label = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
        .filter(isVisibleElement)
        .find((element) => normalizeLooseFieldLabel(element.textContent) === '\u6bdb\u91cd');
      const unitText = String(label && label.textContent || '');
      if (/(?:kg|\u5343\u514b)/i.test(unitText)) return normalizeWeight(raw + 'kg');
      if (/(?:g|\u514b)/i.test(unitText)) return normalizeWeight(raw + 'g');
    }
    return normalizeWeight(raw);
  }

  function cleanValue(value) {
    const text = compactText(value);
    if (!text || text === '--' || /^--\s*(g|kg|ml|mL|l|L|\u514b|\u5343\u514b|\u6beb\u5347|\u5347|\w*\([^)]*\))?/i.test(text)) return '';
    if (/^[\s:：*]*(\u51c0\u542b\u91cf|\u51c0\u91cd|\u6bdb\u91cd|\u89c4\u683c\u578b\u53f7|\u5bb9\u91cf)(\s+|\u3000)*(\u51c0\u542b\u91cf|\u51c0\u91cd|\u6bdb\u91cd|\u89c4\u683c\u578b\u53f7|\u5bb9\u91cf)?[\s:：*]*$/.test(text)) return '';
    return text;
  }

  function parseDimension(text, limit) {
    const nums = String(text || '').match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < limit) return null;
    return nums.map(Number);
  }

  function appendChineseRemark(label, remark) {
    const base = label || L.packageSize;
    return new RegExp('\uff08' + escapeRegExp(remark) + '\uff09').test(base) ? base : base + '\uff08' + remark + '\uff09';
  }

  function firstNumber(text) {
    const match = String(text || '').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function findSku(text) {
    return (text.match(/\u5546\u54c1\u7f16\u7801[:\uff1a]\s*(SKU\d+)/i) || text.match(/\b(SKU\d+)\b/i) || [])[1] || '';
  }

  function cleanName(name) {
    return compactText(name)
      .replace(/\s*(\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|PRODUCT NAME)[:\uff1a].*$/i, '')
      .replace(/\s*[\uff08(]\d+[\uff09)]\s*$/g, '')
      .trim();
  }

  function normalizeProductNameValue(value) {
    const text = compactText(value);
    if (!text || /^(?:--+|—+|－+|未填写|未命名|预设编码新品)$/i.test(text)) return '';
    return text;
  }

  function findTabButton(root, text) {
    const candidates = Array.from(root.querySelectorAll('[role="tab"], .ant-tabs-tab, .ant-tabs-tab-btn, button, div'))
      .filter(isVisibleElement)
      .filter((el) => {
        const current = compactText(el.textContent);
        return current === text || current.startsWith(text + ' ');
      });
    return candidates.find((el) => el.getAttribute('role') === 'tab')
      || candidates.find((el) => String(el.className || '').includes('ant-tabs-tab-btn'))
      || candidates[0]
      || null;
  }

  function getActiveTabText(root) {
    const active = Array.from(root.querySelectorAll('[role="tab"], .ant-tabs-tab'))
      .filter(isVisibleElement)
      .find(isActiveTab);
    return active ? compactText(active.textContent) : '';
  }

  function isActiveTab(tab) {
    const tabRoot = tab.closest('.ant-tabs-tab') || tab;
    return /\bant-tabs-tab-active\b/.test(String(tabRoot.className || ''))
      || tab.getAttribute('aria-selected') === 'true';
  }
