  // SKU00064102 established this template. Add new layouts as separate rules
  // once a matching carton and/or label has been reviewed.
  const PRODUCT_DEVELOPMENT_ROLL_ON_PSD_FIELDS = [
    ['name', '英文品名'], ['translations', '多语言品名'], ['net', '净含量'],
    ['ingredients', '成分表', 'carton'], ['directions', '使用方法', 'carton'],
    ['warnings', '警示语', 'carton'], ['safeUse', '安全使用提示', 'carton'],
    ['shelfLife', '保质期', 'carton'], ['email', '联系邮箱', 'carton'],
    ['origin', '产地'], ['distributor', '经销商'], ['address', '经销商地址'],
    ['eu', '欧代 EU REP'], ['uk', '英代 UK REP'], ['us', '美代 US REP'],
  ];

  function productDevelopmentPsdReviewNormalize(text) {
    return String(text || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
  }

  function productDevelopmentPsdReviewNameList(value) {
    return String(value || '').split(/[;；]/).map((name) => name.trim()).filter(Boolean);
  }

  function productDevelopmentPsdReviewIngredients(value) {
    // Preserve INCI locants such as 1,2-HEXANEDIOL and commas inside parentheses.
    const items = [];
    let start = 0;
    let depth = 0;
    for (let index = 0; index < value.length; index++) {
      const char = value[index];
      if (char === '(') depth++;
      if (char === ')') depth = Math.max(0, depth - 1);
      if (depth || !/[,，、;；\n]/.test(char)) continue;
      if (char === ',' && /\d/.test(value[index - 1] || '') && /\d/.test(value[index + 1] || '')) continue;
      items.push(value.slice(start, index).trim());
      start = index + 1;
    }
    return items.concat(value.slice(start).trim()).filter(Boolean);
  }

  function productDevelopmentPsdReviewBlocks(text) {
    const blocks = Object.create(null);
    let key = '';
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      const heading = /^(PRODUCT\s+NAME|INGREDIENTS?|DIRECTIONS(?:\s+OF\s+SAFE\s+USE)?|WARNINGS?|SHELF\s+LIFE|E[ -]?MAIL|DISTRIBUTED\s+BY|ADDRESS)\s*[:：]\s*(.*)$/i.exec(line);
      if (heading) {
        key = heading[1].toUpperCase().replace(/\s+/g, ' ');
        blocks[key] = heading[2] || '';
        continue;
      }
      const net = line.match(/^(?:NET\s+(?:CONTENT|WT\.?)\s*[:：]?\s*)?(\d+(?:[.,]\d+)?\s*(?:ML|G|L|MG)\b.*?)(?=\s+MADE\s+IN\b|$)/i);
      const origin = line.match(/(?:^|\s)(MADE\s+IN\s+.+)$/i);
      if (net || /^MADE\s+IN\b/i.test(line)) {
        if (net) blocks.net = net[1];
        if (origin) blocks.origin = origin[1];
        key = '';
      } else if (key && line) {
        blocks[key] += (blocks[key] ? '\n' : '') + line;
      }
    }
    return blocks;
  }

  function productDevelopmentPsdReviewRepresentative(layers, role, company) {
    const marker = layers.find((layer) => layer.text.trim().toUpperCase() === role.toUpperCase());
    if (marker && marker.bounds) {
      const tag = marker.bounds;
      const height = Math.max(tag.bottom - tag.top, 1);
      const candidates = layers.filter((layer) => {
        const box = layer.bounds;
        return box && layer.text.split('\n').length >= 3 &&
          Math.abs(box.left - tag.left) <= height * 2 && box.top >= tag.bottom && box.top - tag.bottom <= height * 5;
      });
      if (candidates.length === 1) return candidates[0].text;
    }
    const expected = productDevelopmentPsdReviewNormalize(company).toLowerCase();
    return expected && layers.find((layer) => layer.text.includes('\n') &&
      productDevelopmentPsdReviewNormalize(layer.text.split('\n')[0]).toLowerCase() === expected)?.text || '';
  }

  function productDevelopmentPsdReviewReference(record) {
    const sections = new Map(record.sections.map((section) => [section.key, section]));
    const value = (key, heading) => {
      const text = copywritingSectionCopyValue(sections.get(key));
      return heading ? text.replace(heading, '').trim() : text;
    };
    const name = value('productName', /^PRODUCT\s+NAME\s*[:：]\s*/i).split('\n')[0];
    const names = productDevelopmentPsdReviewNameList((sections.get('functions')?.text || '').replace(/\n+/g, ';'));
    if (name && productDevelopmentPsdReviewMatches(names[0] || '', name, 'name')) names.shift();
    const ingredients = value('ingredients', /^INGREDIENTS?\s*[:：]\s*/i) ||
      [value('activeIngredients', /^ACTIVE\s+INGREDIENTS?\s*[:：]\s*/i),
        value('inactiveIngredients', /^INACTIVE\s+INGREDIENTS?\s*[:：]\s*/i)].filter(Boolean).join('\n');
    const reference = {
      name,
      translations: names.join('\n'),
      net: sections.get('netContent')?.text || '',
      ingredients: productDevelopmentPsdReviewIngredients(ingredients).join('\n'),
      directions: value('directions', /^DIRECTIONS(?:\s+OF\s+SAFE\s+USE)?\s*[:：]\s*/i),
      warnings: value('warning', /^WARNINGS?\s*[:：]\s*/i),
      safeUse: value('safeUse'),
      shelfLife: value('shelfLife'),
      email: value('email', /^E[ -]?MAIL\s*[:：]\s*/i),
      origin: value('origin'),
      distributor: value('distributedBy'),
      address: value('address'),
      eu: value('euRep'),
      uk: value('ukRep'),
      us: value('usRep'),
    };
    if (reference.origin && !/^MADE\s+IN\b/i.test(reference.origin)) reference.origin = 'MADE IN ' + reference.origin;
    return reference;
  }

  function productDevelopmentPsdReviewExtract(layers, fileName, reference) {
    const candidates = layers.map((layer) => {
      const blocks = productDevelopmentPsdReviewBlocks(layer.text);
      const names = productDevelopmentPsdReviewNameList(layer.text.split('\n').find((line) => line.split(/[;；]/).length >= 5) || '');
      const cartonName = blocks['PRODUCT NAME']?.split('\n')[0] || '';
      const cartonEvidence = Boolean(blocks.INGREDIENTS || blocks['DIRECTIONS OF SAFE USE'] || blocks.DIRECTIONS);
      const distributorBlock = /^(?:DISTRIBUTED\s+BY|ADDRESS)\s*[:：]/i.test(layer.text.trim());
      return { blocks, names, cartonName, cartonEvidence, distributorBlock };
    });
    const cartons = candidates.filter((item) => item.cartonName && item.cartonEvidence);
    const labels = candidates.filter((item) => item.names.length >= 5 && item.blocks.net &&
      (item.blocks['DISTRIBUTED BY'] || item.blocks.ADDRESS) && !item.cartonName && !item.cartonEvidence);
    if (cartons.length + labels.length !== 1) return null;
    const [carton] = cartons;
    const [label] = labels;
    const type = carton ? 'carton' : 'label';
    if (type === 'label' && /纸盒|carton/i.test(fileName) || type === 'carton' && /标签|(?:^|\b)label\b/i.test(fileName)) return null;
    const { blocks, names } = carton || label;
    const ingredients = blocks.INGREDIENTS || blocks.INGREDIENT || '';
    // Some cartons keep the distributor panel in its own editable text layer.
    const distributorBlocks = carton ? candidates.filter((item) => item.distributorBlock) : [];
    const distributorValue = (key) => {
      if (blocks[key]) return blocks[key];
      const values = [...new Set(distributorBlocks.map((item) => item.blocks[key]).filter(Boolean))];
      return values.length === 1 ? values[0] : '';
    };
    const values = {
      name: carton ? carton.cartonName : names[0],
      translations: names.slice(1).join('\n'),
      net: blocks.net,
      origin: blocks.origin,
      distributor: distributorValue('DISTRIBUTED BY'),
      address: distributorValue('ADDRESS'),
      ingredients: ingredients && productDevelopmentPsdReviewIngredients(ingredients).join('\n'),
      directions: blocks['DIRECTIONS OF SAFE USE'] || blocks.DIRECTIONS,
      warnings: blocks.WARNING || blocks.WARNINGS,
      shelfLife: blocks['SHELF LIFE'],
      email: blocks['E-MAIL'] || blocks.EMAIL || blocks['E MAIL'],
      safeUse: layers.find((layer) => /^safe\s+use\s*\|/i.test(layer.text))?.text.match(/[:：]\s*([\s\S]+)/)?.[1]?.trim(),
    };
    for (const role of ['eu', 'uk', 'us']) {
      values[role] = productDevelopmentPsdReviewRepresentative(layers, role, reference[role]?.split('\n')[0]);
    }
    return { type, values };
  }

  function productDevelopmentPsdReviewComparable(value, field) {
    const normalize = (text) => productDevelopmentPsdReviewNormalize(text).toLowerCase();
    if (field === 'ingredients' || field === 'translations') return String(value || '').split('\n').map(normalize).filter(Boolean).join('\n');
    return normalize(value).replace(/\s*([,，])\s*/g, ',');
  }

  function productDevelopmentPsdReviewMatches(actual, expected, field) {
    if (field === 'net') {
      const units = (value) => Array.from(value.toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*(fl\.?\s*oz\.?|ml|g|l|mg|oz\.?)\b/g),
        ([, amount, unit]) => ({ amount: Number(amount.replace(',', '.')), unit: unit.replace(/[.\s]/g, '') }));
      const target = units(expected);
      if (target.length) {
        const measured = units(actual);
        return target.every(({ unit, amount }) => {
          const sameUnit = measured.filter((item) => item.unit === unit);
          return sameUnit.length && sameUnit.every((item) => item.amount === amount);
        });
      }
    }
    return productDevelopmentPsdReviewComparable(actual, field) === productDevelopmentPsdReviewComparable(expected, field);
  }

  function productDevelopmentPsdReviewAssess(report, fileName, reference) {
    const extracted = productDevelopmentPsdReviewExtract(report.layers, fileName, reference);
    if (!extracted) return { ...report, type: '', rows: [] };
    const rows = PRODUCT_DEVELOPMENT_ROLL_ON_PSD_FIELDS.flatMap(([key, label, type]) => {
      if (type && type !== extracted.type) return [];
      const actual = extracted.values[key] || '';
      const expected = reference[key] || '';
      if (!actual && !expected) return [];
      const status = !actual ? 'unread' : !expected ? 'reference' :
        productDevelopmentPsdReviewMatches(actual, expected, key) ? 'match' : 'difference';
      return [{ key, label, actual, expected, status }];
    });
    return { ...report, type: extracted.type, rows };
  }
