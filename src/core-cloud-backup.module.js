
  function buildCachePayload(options) {
    const opts = options || {};
    const items = {};
    state.index.forEach((item) => {
      const data = loadData(item.sku);
      if (data) items[item.sku] = data;
    });
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      backupOwnerName: getCloudBackupOwnerName(),
      includesImageLinks: true,
      index: state.index,
      items,
      uploadRecords: {
        queue: sanitizeUploadRecords(loadUploadQueue()),
        history: sanitizeUploadRecords(loadUploadHistory()),
      },
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(undefined, { includeLocalImages: Boolean(opts.includeLocalTranslateImages) }),
      productDevelopmentLocalCache: buildProductDevelopmentLocalCacheBackup(),
      dailyLedger: sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger()),
      dailyLedgerTrash: sanitizeLedgerTrashRecords(state.ledgerTrashRecords || loadDailyLedgerTrash()),
      insights: state.insights || emptyInsights(),
    };
  }

  function buildProductDevelopmentLocalCacheBackup() {
    const prefix = 'plm-floating-helper:product-development-';
    const entries = {};
    try {
      if (typeof GM_listValues === 'function' && typeof GM_getValue === 'function') {
        GM_listValues().filter((key) => String(key).startsWith(prefix)).forEach((key) => {
          const value = GM_getValue(key, null);
          if (value !== null && value !== undefined) entries[key] = value;
        });
      } else if (typeof localStorage !== 'undefined') {
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index);
          if (!key || !key.startsWith(prefix)) continue;
          const raw = localStorage.getItem(key);
          try { entries[key] = JSON.parse(raw); } catch (error) { entries[key] = raw; }
        }
      }
    } catch (error) {
      console.warn('PLM product-development cache backup scan failed:', error);
    }
    return { version: 1, entries };
  }

  function restoreProductDevelopmentLocalCacheBackup(value) {
    const prefix = 'plm-floating-helper:product-development-';
    const entries = value && value.entries && typeof value.entries === 'object' ? value.entries : {};
    Object.keys(entries).forEach((key) => {
      if (!key.startsWith(prefix)) return;
      writeProductDevelopmentStorage(key, entries[key]);
    });
  }

  function buildCompactCopywritingBackup(record) {
    const source = normalizeCopywritingRecord(record);
    if (!source) return null;
    return {
      ...source,
      fullText: String(source.fullText || '').slice(0, 12000),
      sections: (source.sections || []).slice(0, 40).map((section) => ({
        ...section,
        text: String(section.text || '').slice(0, 2200),
      })),
      previousSections: [],
      changedSectionKeys: [],
      removedSections: [],
    };
  }

  function buildCompactCachePayload(fullPayload) {
    const source = fullPayload || buildCachePayload();
    const compactIndex = Array.isArray(source.index) ? source.index.slice(0, 2000) : [];
    const indexedSkus = new Set(compactIndex.map((item) => String(item && (item.sku || item.code) || item || '').trim()).filter(Boolean));
    const items = {};
    let itemCount = 0;
    Object.keys(source.items || {}).forEach((sku) => {
      if (indexedSkus.size && !indexedSkus.has(String(sku))) return;
      if (itemCount >= 2000) return;
      const item = source.items[sku];
      if (!item || typeof item !== 'object') return;
      const compact = { ...item };
      if (compact.copywriting) compact.copywriting = buildCompactCopywritingBackup(compact.copywriting);
      if (Array.isArray(compact.ingredientItems)) compact.ingredientItems = compact.ingredientItems.slice(0, 40);
      delete compact.lastMissingDiagnostic;
      delete compact.recentFieldChanges;
      items[sku] = compact;
      itemCount += 1;
    });
    const uploadRecords = source.uploadRecords || {};
    const compactUploadRecords = {
      queue: sanitizeUploadRecords(uploadRecords.queue).slice(0, 120),
      history: sanitizeUploadRecords(uploadRecords.history).slice(0, 120),
    };
    const insights = sanitizeInsights(source.insights || emptyInsights());
    insights.priceHistory = insights.priceHistory.slice(0, 400);
    insights.dataIssues = insights.dataIssues.slice(0, 400);
    return {
      plugin: source.plugin || L.title,
      version: source.version || SCRIPT_VERSION,
      exportedAt: source.exportedAt || new Date().toLocaleString(),
      backupOwnerName: source.backupOwnerName || '',
      backupMode: 'compact-v1',
      includesImageLinks: true,
      index: compactIndex,
      items,
      uploadRecords: compactUploadRecords,
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(source.productDevelopmentTranslateWorkspaces),
      productDevelopmentLocalCache: source.productDevelopmentLocalCache || { version: 1, entries: {} },
      dailyLedger: sanitizeLedgerRecords(source.dailyLedger).slice(0, 600),
      dailyLedgerTrash: sanitizeLedgerTrashRecords(source.dailyLedgerTrash).slice(0, 600),
      insights,
    };
  }

  function compactBackupText(value, limit) {
    const maxLength = Number(limit) > 0 ? Number(limit) : 240;
    return String(value === undefined || value === null ? '' : value).slice(0, maxLength);
  }

  function buildCompactBackupIndex(index) {
    return (Array.isArray(index) ? index : []).slice(0, 2000).map((item) => {
      const source = item && typeof item === 'object' ? item : { sku: item };
      return {
        sku: compactBackupText(source.sku || source.code, 80),
        brand: compactBackupText(source.brand, 120),
        name: compactBackupText(source.name || source.productName, 220),
        packageCode: compactBackupText(source.packageCode, 120),
        printCode: compactBackupText(source.printCode, 180),
        designAssignedAt: compactBackupText(source.designAssignedAt, 80),
        acquiredAt: compactBackupText(source.acquiredAt, 80),
        acquiredAtMs: Number(source.acquiredAtMs || 0) || 0,
        skuListSource: compactBackupText(source.skuListSource, 40),
        pinned: Boolean(source.pinned),
        pinOrder: Number(source.pinOrder || 0) || 0,
        updatedAt: compactBackupText(source.updatedAt, 80),
        updatedAtMs: Number(source.updatedAtMs || 0) || 0,
      };
    }).filter((item) => item.sku);
  }

  function buildMinimalCopywritingBackup(record) {
    const source = normalizeCopywritingRecord(record);
    if (!source) return null;
    return {
      fileName: compactBackupText(source.fileName, 180),
      parserVersion: compactBackupText(source.parserVersion, 30),
      fileTimestamp: compactBackupText(source.fileTimestamp, 24),
      fileHash: compactBackupText(source.fileHash, 80),
      fetchedAt: compactBackupText(source.fetchedAt, 60),
      lastCheckedAtMs: Number(source.lastCheckedAtMs || 0) || 0,
      fullText: compactBackupText(source.fullText, 2400),
      sections: (source.sections || []).slice(0, 8).map((section) => ({
        key: compactBackupText(section.key, 60),
        label: compactBackupText(section.label, 100),
        text: compactBackupText(section.text, 450),
      })).filter((section) => section.key && section.text),
      ingredientEnglish: compactBackupText(source.ingredientEnglish, 1600),
      ingredientChinese: compactBackupText(source.ingredientChinese, 1600),
      cleanedIngredientEnglish: compactBackupText(source.cleanedIngredientEnglish, 1600),
      cleanedIngredientChinese: compactBackupText(source.cleanedIngredientChinese, 1600),
      ingredientSplit: Boolean(source.ingredientSplit),
      missingSections: (source.missingSections || []).slice(0, 12).map((item) => compactBackupText(item, 80)).filter(Boolean),
      updatePending: Boolean(source.updatePending),
      changedSectionKeys: (source.changedSectionKeys || []).slice(0, 12).map((item) => compactBackupText(item, 60)).filter(Boolean),
      removedSections: (source.removedSections || []).slice(0, 12).map((item) => compactBackupText(item, 80)).filter(Boolean),
      previousSections: [],
      copiedSectionKeys: (source.copiedSectionKeys || []).slice(0, 20).map((item) => compactBackupText(item, 60)).filter(Boolean),
      copiedFullText: Boolean(source.copiedFullText),
    };
  }

  function buildMinimalInfringementHistoryBackup(history) {
    return normalizeInfringementHistory(history).slice(-8).map((entry) => ({
      id: compactBackupText(entry.id, 80),
      updatedAt: compactBackupText(entry.updatedAt, 80),
      updatedAtMs: Number(entry.updatedAtMs || 0) || 0,
      source: compactBackupText(entry.source, 80),
      imageUrls: entry.imageUrls.slice(0, 8).map((url) => compactBackupText(url, 600)).filter(Boolean),
      copywriting: compactBackupText(entry.copywriting, 2400),
    })).filter((entry) => entry.imageUrls.length || entry.copywriting);
  }

  function buildMinimalDataUpdateLogBackup(log) {
    return normalizeDataUpdateLog(log).slice(-20).map((entry) => ({
      id: compactBackupText(entry.id, 80),
      changedAt: compactBackupText(entry.changedAt, 80),
      changedAtMs: Number(entry.changedAtMs || 0) || 0,
      source: compactBackupText(entry.source, 80),
      changes: entry.changes.slice(0, 12).map((change) => ({
        key: compactBackupText(change.key, 80),
        label: compactBackupText(change.label, 100),
        before: compactBackupText(change.before, 700),
        after: compactBackupText(change.after, 700),
      })).filter((change) => change.key),
    })).filter((entry) => entry.changes.length);
  }

  const MINIMAL_BACKUP_ITEM_FIELDS = [
    'accessories', 'specificationText',
    'sku', 'brand', 'name', 'englishName', 'manualCategory', 'plmCategory', 'category', 'productType', 'aiCategory', 'aiProductType',
    'developerText', 'developerName', 'projectStatus', 'projectId', 'projectRowId', 'projectVersionId', 'apiMaterialSource',
    'designType', 'artPriority', 'designAssignedAt', 'developmentAssignedAt', 'acquiredAt', 'acquiredAtMs', 'skuListSource', 'referenceUrl',
    'infringementImageUrls', 'infringementImageSource', 'infringementCopywriting', 'infringementUpdatedAt', 'infringementUpdatedAtMs',
    'packageSizeText', 'packageSizeLabel', 'packageCode', 'packageNums', 'manualFieldOverrides',
    'printSizeText', 'printSizeLabel', 'printCode',
    'tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey', 'isTubePrintMaterial',
    'productNums', 'plmProductNums', 'bottleNums', 'singleBottle', 'hasInnerCard', 'productSizeSource', 'omitEstimatedProductSize',
    'netContent', 'grossWeight', 'purchasePrice', 'packageSource', 'materialDimensionUnitIssues',
    'plmIngredientText', 'plmIngredientEnglishText', 'plmIngredientParserVersion', 'plmIngredientCheckedAt',
    'ingredientEnglish', 'ingredientChinese', 'copywritingIngredientEnglish', 'copywritingIngredientChinese', 'copywritingIngredientSplit',
    'ingredientWordFileName', 'ingredientWordHash', 'ingredientWordUpdatedAt',
    'ingredientPdfFileName', 'ingredientPdfHash', 'ingredientPdfModel', 'ingredientPdfUpdatedAt', 'ingredientNormalizerVersion', 'ingredientSource',
    'seenProject', 'seenMaterial', 'seenProduct', 'seenDesign', 'isToy', 'seriesExcluded', 'updatedAt', 'updatedAtMs',
  ];

  function buildMinimalCacheItem(item, sku) {
    const source = item && typeof item === 'object' ? item : {};
    const compact = {};
    MINIMAL_BACKUP_ITEM_FIELDS.forEach((key) => {
      const value = source[key];
      if (value === undefined || value === null || value === '') return;
      if (key === 'accessories') {
        compact[key] = normalizeAccessories(value);
      } else if (key === 'materialDimensionUnitIssues') {
        const issues = value && typeof value === 'object' ? value : {};
        compact[key] = {
          package: issues.package ? { unit: 'm', raw: compactBackupText(issues.package.raw, 120) } : null,
          print: issues.print ? { unit: 'm', raw: compactBackupText(issues.print.raw, 120) } : null,
        };
      } else if (Array.isArray(value)) {
        compact[key] = value.slice(0, 12).map((entry) => typeof entry === 'number'
          ? entry
          : compactBackupText(entry, key === 'infringementImageUrls' ? 600 : 120)).filter(Boolean);
      } else if (typeof value === 'string') {
        compact[key] = compactBackupText(value, /ingredient/i.test(key) ? 1800 : (key === 'referenceUrl' ? 600 : (key === 'infringementCopywriting' ? 2400 : 400)));
      } else {
        compact[key] = value;
      }
    });
    compact.sku = compactBackupText(source.sku || sku, 80);
    const infringementHistory = buildMinimalInfringementHistoryBackup(source.infringementHistory);
    if (infringementHistory.length) compact.infringementHistory = infringementHistory;
    const dataUpdateLog = buildMinimalDataUpdateLogBackup(source.dataUpdateLog);
    if (dataUpdateLog.length) compact.dataUpdateLog = dataUpdateLog;
    if (source.copywriting) compact.copywriting = buildMinimalCopywritingBackup(source.copywriting);
    if (Array.isArray(source.ingredientItems)) {
      compact.ingredientItems = source.ingredientItems.slice(0, 20).map((itemValue) => {
        const entry = itemValue && typeof itemValue === 'object' ? itemValue : { value: itemValue };
        return {
          name: compactBackupText(entry.name || entry.label || entry.ingredient || entry.ingredientName, 120),
          english: compactBackupText(entry.english || entry.en || entry.englishName, 300),
          chinese: compactBackupText(entry.chinese || entry.zh || entry.chineseName, 300),
          amount: compactBackupText(entry.amount || entry.content || entry.quantity, 120),
          value: compactBackupText(entry.value || entry.text, 400),
        };
      }).filter((itemValue) => Object.values(itemValue).some(Boolean));
    }
    return compact;
  }

  function buildMinimalUploadRecords(records) {
    const fields = [
      ['id', 120], ['sku', 80], ['name', 180], ['kind', 40], ['mode', 40], ['sourceName', 180],
      ['xlsxName', 180], ['zipName', 180], ['status', 80], ['step', 160], ['error', 220],
      ['createdAt', 80], ['updatedAt', 80], ['finishedAt', 80],
    ];
    return (Array.isArray(records) ? records : []).slice(0, 60).map((record) => {
      const source = record && typeof record === 'object' ? record : {};
      const compact = {};
      fields.forEach(([key, limit]) => {
        const value = source[key];
        if (value === undefined || value === null || value === '') return;
        compact[key] = typeof value === 'number' || typeof value === 'boolean' ? value : compactBackupText(value, limit);
      });
      ['fileCount', 'successCount', 'failedCount'].forEach((key) => {
        if (source[key] !== undefined && source[key] !== null) compact[key] = Number(source[key]) || 0;
      });
      return compact;
    }).filter((record) => record.id || record.sku);
  }

  function stripMinimalBackupLedgerLinks(record) {
    const compact = { ...record };
    delete compact.skuImageUrl;
    delete compact.benchmarkImageUrl;
    delete compact.referenceUrl;
    delete compact.aiMainImages;
    delete compact.aiDetailImages;
    delete compact.aiMainRetouchedImages;
    delete compact.aiDetailRetouchedImages;
    delete compact.aiMainRetouchTasks;
    delete compact.aiDetailRetouchTasks;
    return compact;
  }

  function buildMinimalLedgerRecords(records) {
    return sanitizeLedgerRecords(records).slice(0, 360).map(stripMinimalBackupLedgerLinks);
  }

  function buildMinimalLedgerTrashRecords(records) {
    return sanitizeLedgerTrashRecords(records).slice(0, 360).map(stripMinimalBackupLedgerLinks);
  }

  function buildMinimalCachePayload(fullPayload) {
    const source = fullPayload || buildCachePayload();
    const compactIndex = buildCompactBackupIndex(source.index);
    const indexedSkus = new Set(compactIndex.map((item) => item.sku));
    const items = {};
    let itemCount = 0;
    Object.keys(source.items || {}).forEach((sku) => {
      if (indexedSkus.size && !indexedSkus.has(String(sku))) return;
      if (itemCount >= 2000) return;
      const item = source.items[sku];
      if (!item || typeof item !== 'object') return;
      items[sku] = buildMinimalCacheItem(item, sku);
      itemCount += 1;
    });
    const uploadRecords = source.uploadRecords || {};
    const insights = sanitizeInsights(source.insights || emptyInsights());
    insights.priceHistory = insights.priceHistory.slice(0, 120);
    insights.dataIssues = insights.dataIssues.slice(0, 120);
    return {
      plugin: source.plugin || L.title,
      version: source.version || SCRIPT_VERSION,
      exportedAt: source.exportedAt || new Date().toLocaleString(),
      backupOwnerName: source.backupOwnerName || '',
      backupMode: 'minimal-v1',
      includesImageLinks: false,
      index: compactIndex,
      items,
      uploadRecords: {
        queue: buildMinimalUploadRecords(uploadRecords.queue),
        history: buildMinimalUploadRecords(uploadRecords.history),
      },
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(source.productDevelopmentTranslateWorkspaces),
      productDevelopmentLocalCache: source.productDevelopmentLocalCache || { version: 1, entries: {} },
      dailyLedger: buildMinimalLedgerRecords(source.dailyLedger),
      dailyLedgerTrash: buildMinimalLedgerTrashRecords(source.dailyLedgerTrash),
      insights,
    };
  }

  function buildIndexOnlyCachePayload(fullPayload) {
    const source = fullPayload || buildCachePayload();
    const compactIndex = buildCompactBackupIndex(source.index);
    const items = {};
    compactIndex.forEach((item) => {
      items[item.sku] = {
        sku: item.sku,
        brand: item.brand,
        name: item.name,
        packageCode: item.packageCode,
        printCode: item.printCode,
        designAssignedAt: item.designAssignedAt,
        acquiredAt: item.acquiredAt,
        acquiredAtMs: item.acquiredAtMs,
        skuListSource: item.skuListSource,
        updatedAt: item.updatedAt,
        updatedAtMs: item.updatedAtMs,
      };
    });
    return {
      plugin: source.plugin || L.title,
      version: source.version || SCRIPT_VERSION,
      exportedAt: source.exportedAt || new Date().toLocaleString(),
      backupOwnerName: source.backupOwnerName || '',
      backupMode: 'index-only-v1',
      includesImageLinks: false,
      index: compactIndex,
      items,
      uploadRecords: { queue: [], history: [] },
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(source.productDevelopmentTranslateWorkspaces),
      productDevelopmentLocalCache: source.productDevelopmentLocalCache || { version: 1, entries: {} },
      dailyLedger: [],
      dailyLedgerTrash: [],
      insights: emptyInsights(),
    };
  }

  function getCloudBackupCryptoApi() {
    const cryptoApi = typeof window !== 'undefined' && window.crypto
      ? window.crypto
      : (typeof crypto !== 'undefined' ? crypto : null);
    if (!cryptoApi || !cryptoApi.subtle || typeof cryptoApi.getRandomValues !== 'function') {
      throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u4e91\u5907\u4efd\u52a0\u5bc6');
    }
    return cryptoApi;
  }

  function createCloudBackupRandomBytes(length) {
    const bytes = new Uint8Array(length);
    getCloudBackupCryptoApi().getRandomValues(bytes);
    return bytes;
  }

  function createCloudBackupSnapshotId() {
    return Array.from(createCloudBackupRandomBytes(18))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function getCloudBackupId(backupKey) {
    const digest = await getCloudBackupCryptoApi().subtle.digest('SHA-256', new TextEncoder().encode(String(backupKey || '')));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Stable content hash for skip-if-unchanged uploads. exportedAt is stamped
  // per build, so it must be stripped or every snapshot would hash differently
  // and the dedupe would never fire.
  async function computeCloudBackupPayloadHash(payload) {
    const stable = payload && typeof payload === 'object' ? { ...payload } : {};
    delete stable.exportedAt;
    const digest = await getCloudBackupCryptoApi().subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(stable))
    );
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function deriveCloudBackupCryptoKey(backupKey, salt, iterations) {
    const cryptoApi = getCloudBackupCryptoApi();
    const requestedIterations = Number(iterations);
    const kdfIterations = Number.isInteger(requestedIterations) && requestedIterations >= 100000 && requestedIterations <= 500000
      ? requestedIterations
      : CLOUD_BACKUP_KDF_ITERATIONS;
    const passwordKey = await cryptoApi.subtle.importKey(
      'raw',
      new TextEncoder().encode(String(backupKey || '')),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return cryptoApi.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: kdfIterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function compressCloudBackupText(serialized) {
    const raw = new TextEncoder().encode(serialized);
    if (typeof CompressionStream !== 'function') return { bytes: raw, compression: 'none' };
    const stream = new Blob([raw], { type: 'application/json' })
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return compressed.byteLength < raw.byteLength
      ? { bytes: compressed, compression: 'gzip' }
      : { bytes: raw, compression: 'none' };
  }

  async function encodeCloudBackupPayload(payload, backupKey) {
    const serialized = JSON.stringify(payload);
    const prepared = await compressCloudBackupText(serialized);
    const salt = createCloudBackupRandomBytes(16);
    const iv = createCloudBackupRandomBytes(12);
    const key = await deriveCloudBackupCryptoKey(backupKey, salt, payload.kdfIterations);
    const encrypted = await getCloudBackupCryptoApi().subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      prepared.bytes
    );
    return {
      format: 'plm-backup-v2',
      encryption: 'aes-256-gcm',
      compression: prepared.compression,
      kdf: 'pbkdf2-sha256',
      kdfIterations: CLOUD_BACKUP_KDF_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      uncompressedLength: new TextEncoder().encode(serialized).byteLength,
      plugin: payload.plugin || L.title,
      version: payload.version || SCRIPT_VERSION,
      exportedAt: payload.exportedAt || new Date().toLocaleString(),
      backupOwnerName: payload.backupOwnerName || '',
      backupMode: payload.backupMode || 'full',
      data: bytesToBase64(new Uint8Array(encrypted)),
    };
  }

  async function decodeCloudBackupPayload(payload, backupKey) {
    if (!payload || payload.format !== 'plm-backup-v2') {
      if (!payload || payload.compression !== 'gzip-base64' || !payload.data) return payload;
      if (typeof DecompressionStream !== 'function') throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u89e3\u538b\u4e91\u5907\u4efd\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
      const compressed = base64ToArrayBuffer(payload.data);
      const stream = new Blob([compressed])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      const serialized = await new Response(stream).text();
      return JSON.parse(serialized);
    }
    if (!payload.data) throw new Error('\u4e91\u5907\u4efd\u5206\u7247\u4e0d\u5b8c\u6574');
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt || ''));
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv || ''));
    const key = await deriveCloudBackupCryptoKey(backupKey, salt);
    let decrypted;
    try {
      decrypted = new Uint8Array(await getCloudBackupCryptoApi().subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        base64ToArrayBuffer(payload.data)
      ));
    } catch (_) {
      throw new Error('\u4e91\u5907\u4efd\u5bc6\u94a5\u4e0d\u6b63\u786e\u6216\u6570\u636e\u5df2\u635f\u574f');
    }
    if (payload.compression === 'gzip') {
      if (typeof DecompressionStream !== 'function') throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u89e3\u538b\u4e91\u5907\u4efd\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
      const stream = new Blob([decrypted])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      decrypted = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return JSON.parse(new TextDecoder('utf-8').decode(decrypted));
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function isCloudBackupIdentityCompatibilityError(error) {
    const cloudData = error && error.cloudData ? error.cloudData : {};
    return Boolean(error && error.status === 400 && cloudData.error === 'backupKey too short');
  }

  function createCloudBackupTooLargeError() {
    const error = new Error('payload too large');
    error.cloudData = { error: 'payload too large' };
    error.status = 413;
    return error;
  }

  async function uploadCloudBackupEnvelope(backupId, backupKey, version, envelope) {
    const inlineBody = { backupId, version, payload: envelope };
    if (JSON.stringify(envelope).length <= CLOUD_BACKUP_INLINE_LIMIT) {
      try {
        return { ...(await cloudRequest('/backup/save', { method: 'POST', body: inlineBody })), chunked: false };
      } catch (error) {
        if (!isCloudBackupIdentityCompatibilityError(error)) throw error;
        return { ...(await cloudRequest('/backup/save', { method: 'POST', body: { backupKey, version, payload: envelope } })), chunked: false, legacyIdentity: true };
      }
    }
    const data = String(envelope.data || '');
    const chunkCount = Math.ceil(data.length / CLOUD_BACKUP_CHUNK_SIZE);
    if (!data || chunkCount > CLOUD_BACKUP_MAX_CHUNKS) throw createCloudBackupTooLargeError();
    const snapshotId = createCloudBackupSnapshotId();
    // Re-upload the same immutable snapshot once if an older server pruned it
    // while another window was committing its backup. Never retry other conflicts.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
        const chunk = data.slice(chunkIndex * CLOUD_BACKUP_CHUNK_SIZE, (chunkIndex + 1) * CLOUD_BACKUP_CHUNK_SIZE);
        try {
          await cloudRequest('/backup/chunk', {
            method: 'POST',
            body: { backupId, version, snapshotId, chunkIndex, chunkCount, data: chunk },
          });
        } catch (error) {
          if (error && error.status === 404) throw createCloudBackupTooLargeError();
          throw error;
        }
      }
      const manifest = { ...envelope, chunked: true, snapshotId, chunkCount, chunkSize: CLOUD_BACKUP_CHUNK_SIZE };
      delete manifest.data;
      try {
        const response = await cloudRequest('/backup/save', {
          method: 'POST',
          body: { backupId, version, payload: manifest },
        });
        return { ...(response || {}), chunked: true, bytes: data.length };
      } catch (error) {
        if (attempt || Number(error && error.status) !== 409 || !/backup chunks incomplete/i.test(String(error && error.message || ''))) throw error;
      }
    }
  }

  async function loadCloudBackupRecord(backupKey) {
    const backupId = await getCloudBackupId(backupKey);
    let response;
    try {
      response = await cloudRequest('/backup/load?backupId=' + encodeURIComponent(backupId), { method: 'GET' });
    } catch (error) {
      if (!isCloudBackupIdentityCompatibilityError(error)) throw error;
      response = await cloudRequest('/backup/load?backupKey=' + encodeURIComponent(backupKey), { method: 'GET' });
    }
    if (!response || !response.found || !response.payload || !response.payload.chunked) return response;
    const manifest = response.payload;
    const snapshotId = String(manifest.snapshotId || '');
    const chunkCount = Number(manifest.chunkCount || 0);
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(snapshotId) || !Number.isInteger(chunkCount) || chunkCount <= 0 || chunkCount > CLOUD_BACKUP_MAX_CHUNKS) {
      throw new Error('\u4e91\u5907\u4efd\u5206\u7247\u4fe1\u606f\u65e0\u6548');
    }
    const chunks = [];
    for (let start = 0; start < chunkCount; start += 4) {
      const group = await Promise.all(Array.from({ length: Math.min(4, chunkCount - start) }, (_, offset) => {
        const chunkIndex = start + offset;
        return cloudRequest('/backup/load-chunk?backupId=' + encodeURIComponent(backupId) + '&snapshotId=' + encodeURIComponent(snapshotId) + '&chunkIndex=' + chunkIndex, { method: 'GET' });
      }));
      group.forEach((chunk) => chunks.push(String(chunk && chunk.data || '')));
    }
    if (chunks.length !== chunkCount || chunks.some((chunk) => !chunk)) throw new Error('\u4e91\u5907\u4efd\u5206\u7247\u4e0d\u5b8c\u6574');
    response.payload = { ...manifest, data: chunks.join('') };
    delete response.payload.chunked;
    delete response.payload.snapshotId;
    delete response.payload.chunkCount;
    delete response.payload.chunkSize;
    return response;
  }

  function sanitizeUploadRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 300).map((item) => ({
      ...item,
      xlsxKey: '',
      zipKey: '',
      copyrightFiles: getCopyrightUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      effectFiles: getToyEffectUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      selected: false,
    }));
  }

  function handleImportFile(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importCachePayload(JSON.parse(String(reader.result || '{}')));
        showToast(L.importDone);
        state.view = 'about';
        renderShell();
      } catch (error) {
        console.warn('PLM floating helper import failed:', error);
        showToast(L.importFailed);
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      showToast(L.importFailed);
      event.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  function importCachePayload(payload) {
    const items = payload && payload.items ? payload.items : payload;
    if (!items || typeof items !== 'object') throw new Error('Invalid cache payload');
    Object.keys(items).forEach((sku) => {
      const data = normalizeData({ ...items[sku], sku: (items[sku] && items[sku].sku) || sku });
      if (!data.sku) return;
      saveDataDirect(data.sku, data);
      upsertIndex(data);
    });
    if (Array.isArray(payload.index)) {
      payload.index.forEach((item) => {
        const existing = state.index.find((entry) => entry.sku === item.sku);
        if (!existing) return;
        if (item.brand && !existing.brand) existing.brand = item.brand;
        if (item.pinned) existing.pinned = true;
        if (item.pinOrder) existing.pinOrder = item.pinOrder;
      });
      saveIndex();
    }
    if (payload.uploadRecords && typeof payload.uploadRecords === 'object') {
      if (Array.isArray(payload.uploadRecords.queue)) {
        state.uploadQueue = sanitizeUploadRecords(payload.uploadRecords.queue).map((item) => ({
          ...item,
          status: item.status && /\u6210\u529f|\u5931\u8d25|\u5df2\u8df3\u8fc7|\u5df2\u4fdd\u5b58/.test(item.status) ? item.status : '\u8bf7\u8865\u5145\u6587\u4ef6',
          step: item.step || '\u4e91\u5907\u4efd\u6062\u590d\uff0c\u9700\u91cd\u65b0\u9009\u62e9\u6587\u4ef6',
        }));
        saveUploadQueue();
      }
      if (Array.isArray(payload.uploadRecords.history)) {
        state.uploadHistory = sanitizeUploadRecords(payload.uploadRecords.history);
        saveUploadHistory();
      }
    }
    if (Array.isArray(payload.dailyLedgerTrash)) {
      const importedTrash = sanitizeLedgerTrashRecords(payload.dailyLedgerTrash);
      const importedTrashKeys = new Set(importedTrash.map((item) => getMonthKeyFromDateKey(item.date) + '|' + item.sku));
      state.ledgerTrashRecords = importedTrash.concat((state.ledgerTrashRecords || loadDailyLedgerTrash()).filter((item) => !importedTrashKeys.has(getMonthKeyFromDateKey(item.date) + '|' + item.sku))).slice(0, 1200);
      saveDailyLedgerTrash();
    }
    if (Array.isArray(payload.dailyLedger)) {
      const imported = filterLedgerRecordsNotInTrash(payload.dailyLedger);
      const importedKeys = new Set(imported.map((item) => item.date + '|' + item.sku));
      state.ledgerRecords = filterLedgerRecordsNotInTrash(imported.concat((state.ledgerRecords || loadDailyLedger()).filter((item) => !importedKeys.has(item.date + '|' + item.sku)))).slice(0, 1200);
      saveDailyLedger();
    }
    if (payload.insights && typeof payload.insights === 'object') {
      state.insights = sanitizeInsights(payload.insights);
      saveInsights();
    }
    if (payload.productDevelopmentTranslateWorkspaces) {
      const imported = productDevelopmentTranslateWorkspaceEntries(payload.productDevelopmentTranslateWorkspaces);
      const current = loadProductDevelopmentTranslateWorkspaces();
      Object.keys(imported).forEach((sku) => {
        const incoming = imported[sku];
        const existing = current[sku];
        if (!existing || Number(incoming.updatedAt) >= Number(existing.updatedAt)) {
          current[sku] = existing && existing.imageDataUrl && !incoming.imageDataUrl
            ? { ...incoming, imageDataUrl: existing.imageDataUrl }
            : incoming;
        }
      });
      writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_WORKSPACE_KEY, { version: 1, entries: buildProductDevelopmentTranslateWorkspacesBackup(current, { includeLocalImages: true }) });
      const latest = Object.values(current).sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))[0];
      if (latest) writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_ACTIVE_KEY, { sku: latest.sku, updatedAt: latest.updatedAt });
    }
    if (payload.productDevelopmentLocalCache) restoreProductDevelopmentLocalCacheBackup(payload.productDevelopmentLocalCache);
  }

  function getCloudBackupKey() {
    return String(state.settings.cloudBackupKey || '').trim();
  }

  function isCloudBackupKeyConflict() {
    const key = getCloudBackupKey();
    return Boolean(key && state.settings.cloudBackupConflictKeyHash === diagnosticHash(key));
  }

  function notifyCloudBackupKeyConflict() {
    showToast('备份密钥已由其他账号使用，自动备份已暂停。请打开设置 → 云备份，点击“生成个人密钥并验证”，或填写自己的新密钥', { diagnostic: false });
  }

  function cloudBackupKeyGuideHtml() {
    const conflict = isCloudBackupKeyConflict();
    return '<div class="pfh-about-note"' + (conflict ? ' role="alert"' : '') + '>' +
      (conflict ? '此密钥已由其他账号使用，自动备份已暂停。请换一个仅自己使用的密钥，再保存并验证。' :
        '每人使用不同的备份密钥，请勿与同事共用。同一账号在其他电脑恢复备份时，请使用自己的同一密钥。请妥善保存，恢复备份时需要它。') +
      '</div><div class="pfh-about-actions"><button type="button" data-action="cloud-backup-rekey"' +
      (state.cloudBackupRunning ? ' disabled' : '') + '>生成个人密钥并验证</button></div>';
  }

  function refreshCloudBackupKeyGuide() {
    const guide = ensurePanel().querySelector('.pfh-cloud-key-guide');
    if (guide) guide.innerHTML = cloudBackupKeyGuideHtml();
  }

  function updateCloudBackupKey(value) {
    const key = String(value || '').trim();
    if (key === getCloudBackupKey()) return;
    state.settings.cloudBackupKey = key;
    setCloudBackupStatus(isCloudBackupKeyConflict()
      ? '此密钥已由其他账号使用，请更换个人密钥'
      : '密钥已更换，尚未验证，请点击“保存并验证密钥”');
  }

  async function generatePersonalCloudBackupKey() {
    if (state.cloudBackupRunning) {
      showToast('备份正在进行，请稍后再更换密钥');
      return false;
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const key = 'plm-' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    updateCloudBackupKey(key);
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) input.value = key;
    return saveCloudBackupNow();
  }

  function getCloudBackupOwnerName() {
    const backupKey = getCloudBackupKey();
    if (!backupKey) return '';
    const savedName = String(state.settings.cloudBackupOwnerName || '').trim();
    if (state.settings.cloudBackupOwnerKey === backupKey && savedName) return savedName;
    const name = findCurrentPlmUserName();
    state.settings.cloudBackupOwnerKey = backupKey;
    state.settings.cloudBackupOwnerName = name;
    saveSettings(state.settings);
    return name;
  }

  function findCurrentPlmUserName() {
    const candidates = Array.from(document.querySelectorAll(
      '.btnBoxMainText.ant-dropdown-trigger, [data-user-name], [data-username], .user-name, .userName, .username, .nick-name, .nickName, .nickname, .ant-layout-header .ant-dropdown-trigger, header .ant-dropdown-trigger, [class*="user-info"], [class*="userInfo"], [class*="account-name"], [class*="accountName"], [class*="profile-name"], [class*="profileName"]'
    )).filter(isVisibleElement);
    for (const element of candidates) {
      const ownText = Array.from(element.childNodes || []).filter((node) => node.nodeType === 3).map((node) => node.textContent || '').join(' ').trim();
      const rawValues = [
        element.getAttribute('data-user-name'),
        element.getAttribute('data-username'),
        ownText,
        ...String(element.innerText || element.textContent || '').split(/[\r\n]+/),
      ];
      for (const rawValue of rawValues) {
        const value = String(rawValue || '').trim().replace(/\s+/g, ' ');
        const name = value.replace(/\s+(?:(?:开发|设计|供应链|运营|采购|销售|品控|产品|项目|高级|储备)[^\s]{0,12}(?:主管|经理|专员|工程师|助理|总监|组长|负责人)?).*$/i, '').trim();
        if (/^[\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z ._-]{1,30}$/.test(name) && !/^(PLM|\u7528\u6237|\u8d26\u53f7|\u6211\u7684|\u5f53\u524d\u7528\u6237)$/.test(name) && !/\u9000\u51fa|\u767b\u5f55|\u8bbe\u7f6e|\u5e2e\u52a9/.test(name)) return name;
      }
    }
    return '';
  }

  function getCloudBackupStatusText() {
    if (isCloudBackupKeyConflict()) return '密钥与其他账号冲突，自动备份已暂停，请更换个人密钥';
    return redactCloudBackupOwnerMismatch(state.cloudBackupStatus || state.settings.cloudBackupStatus || L.cloudBackupReady);
  }

  function getInsightAiModelSetting() {
    const saved = state.settings && state.settings.insightAiModel;
    return saved === MODELSCOPE_INSIGHT_MODEL || saved === 'gemini-3.5-flash' ? MODELSCOPE_INSIGHT_MODEL : 'glm-4.7-flash';
  }

  function setCloudBackupStatus(text) {
    state.cloudBackupStatus = text || '';
    state.settings.cloudBackupStatus = state.cloudBackupStatus;
    saveSettings(state.settings);
    const status = ensurePanel().querySelector('.pfh-cloud-status');
    if (status) status.textContent = getCloudBackupStatusText();
    refreshCloudBackupKeyGuide();
  }

  function queueCloudBackup() {
    if (!getCloudBackupKey() || isCloudBackupKeyConflict()) return;
    state.cloudBackupQueued = true;
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
  }

  async function runQueuedCloudBackup() {
    if (!state.cloudBackupQueued || state.cloudBackupRunning) return;
    state.cloudBackupQueued = false;
    await saveCloudBackup({ silent: true });
    if (state.cloudBackupQueued) {
      window.clearTimeout(state.cloudBackupTimer);
      state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
    }
  }

  async function saveCloudBackupNow() {
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupQueued = false;
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      updateCloudBackupKey(input.value);
    }
    try {
      return await saveCloudBackup({ silent: false });
    } catch (error) {
      console.warn('PLM floating helper cloud backup failed:', error);
    }
  }

  async function saveCloudBackup(options) {
    const backupKey = getCloudBackupKey();
    if (isCloudBackupKeyConflict()) {
      if (!(options && options.silent)) notifyCloudBackupKeyConflict();
      return false;
    }
    if (!backupKey) {
      if (!(options && options.silent)) showToast(L.cloudBackupMissingKey);
      return false;
    }
    if (backupKey.length < 4) {
      if (!(options && options.silent)) showToast(L.cloudBackupKeyTooShort);
      return false;
    }
    if (state.cloudBackupRunning) {
      state.cloudBackupQueued = true;
      return false;
    }
    state.cloudBackupRunning = true;
    setCloudBackupStatus(L.cloudBackupSaving);
    if (!(options && options.silent)) showToast(L.cloudBackupSaving);
    const translateDirty = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
    const translateDirtyAt = Number(translateDirty && translateDirty.updatedAt) || 0;
    try {
      const payload = buildCachePayload();
      payload.insights = sanitizeInsightsForCloudBackup(payload.insights);
      if (!payload.backupOwnerName) throw new Error(L.cloudBackupOwnerMissing);
      const backupId = await getCloudBackupId(backupKey);
      const backupAttempts = [
        { label: '\u5b8c\u6574', build: () => payload },
        { label: '\u7cbe\u7b80', build: () => buildCompactCachePayload(payload) },
        { label: '\u8d85\u7cbe\u7b80', build: () => buildMinimalCachePayload(payload) },
        { label: '\u7d22\u5f15', build: () => buildIndexOnlyCachePayload(payload) },
      ];
      let response;
      let uploadedMode = '';
      let uploadedHash = '';
      const lastUpload = state.settings.cloudBackupLastUpload || null;
      for (let attemptIndex = 0; attemptIndex < backupAttempts.length; attemptIndex += 1) {
        const attempt = backupAttempts[attemptIndex];
        if (attemptIndex > 0) {
          addLog('warn', '\u4e91\u5907\u4efd' + backupAttempts[attemptIndex - 1].label + '\u5feb\u7167\u8d85\u9650\uff0c\u6539\u7528' + attempt.label + '\u5feb\u7167\u91cd\u8bd5', state.index.length + ' \u4e2a\u7f16\u7801');
        }
        const attemptPayload = attempt.build();
        const attemptHash = await computeCloudBackupPayloadHash(attemptPayload);
        if (lastUpload && lastUpload.backupId === backupId && lastUpload.hash === attemptHash) {
          // Cloud already holds this exact content; skip the transfer entirely.
          // High-frequency auto backups used to push a full ~4MB snapshot on
          // every 8s debounce even when nothing changed, stacking hundreds of
          // snapshots until D1 hit its size cap (2026-11-10 incident).
          response = { ok: true, userId: backupId, unchanged: true };
          uploadedMode = attempt.label;
          uploadedHash = attemptHash;
          break;
        }
        try {
          response = await uploadCloudBackupEnvelope(backupId, backupKey, SCRIPT_VERSION, await encodeCloudBackupPayload(attemptPayload, backupKey));
          uploadedMode = attempt.label;
          uploadedHash = attemptHash;
          break;
        } catch (error) {
          const cloudData = error && error.cloudData ? error.cloudData : {};
          const tooLarge = cloudData.error === 'payload too large' || (error && error.message === 'payload too large');
          if (!tooLarge || attemptIndex === backupAttempts.length - 1) throw error;
        }
      }
      if (!response || !response.ok || response.userId !== backupId) throw new Error(response && response.error ? response.error : '云端未确认密钥与备份保存结果，请稍后重新验证');
      if (getCloudBackupKey() !== backupKey) return true;
      myProfile.backupOrigin = null;
      myProfile.backupKey = '';
      if (myProfile.open) refreshMyProfileBackup();
      state.settings.cloudBackupConflictKeyHash = '';
      state.settings.cloudBackupLastUpload = { backupId, hash: uploadedHash, at: Date.now() };
      saveSettings(state.settings);
      const downgraded = uploadedMode && uploadedMode !== '\u5b8c\u6574';
      const chunked = Boolean(response.chunked);
      const unchanged = Boolean(response.unchanged);
      const translateDirtyAfter = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
      if (!translateDirtyAfter || Number(translateDirtyAfter.updatedAt) <= translateDirtyAt) writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
      if (unchanged) {
        setCloudBackupStatus(L.cloudBackupUpToDate + ' \u00b7 ' + state.index.length + '\u4e2a\u7f16\u7801');
        addLog('info', '\u4e91\u5907\u5907\u4efd\u5185\u5bb9\u65e0\u53d8\u5316\uff0c\u8df3\u8fc7\u4e0a\u4f20', state.index.length + ' \u4e2a\u7f16\u7801');
        if (!(options && options.silent)) showToast(L.cloudBackupUpToDate);
        return true;
      }
      const backupModeText = downgraded ? '\uff08' + uploadedMode + (chunked ? '\u00b7\u5206\u7247' : '') + '\uff09' : (chunked ? '\uff08\u5206\u7247\uff09' : '');
      setCloudBackupStatus('密钥验证通过 · ' + L.cloudBackupSavedAt + ' ' + new Date().toLocaleTimeString() + '\uff0c' + state.index.length + '\u4e2a\u7f16\u7801' + backupModeText);
      addLog('success', downgraded ? '\u4e91\u5907\u4efd' + uploadedMode + '\u4e0a\u4f20\u6210\u529f' : '\u4e91\u5907\u4efd\u4e0a\u4f20\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801' + (chunked ? '\u00b7\u5206\u7247' : ''));
      if (!(options && options.silent)) showToast(L.cloudBackupSaved);
      return true;
    } catch (error) {
      if (error && error.cloudData && error.cloudData.error === 'backup owner mismatch') {
        state.settings.cloudBackupConflictKeyHash = diagnosticHash(backupKey);
        saveSettings(state.settings);
        if (getCloudBackupKey() === backupKey) {
          state.cloudBackupQueued = false;
          window.clearTimeout(state.cloudBackupTimer);
          notifyCloudBackupKeyConflict();
        }
      }
      if (getCloudBackupKey() !== backupKey) return false;
      const errorMessage = formatCloudBackupSaveError(error);
      console.warn('PLM floating helper cloud backup save failed:', errorMessage);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + errorMessage);
      addLog('error', '\u4e91\u5907\u4efd\u4e0a\u4f20\u5931\u8d25', errorMessage);
      if (!(options && options.silent) && !isCloudBackupKeyConflict()) showToast(L.cloudBackupFailed + '\uff1a' + errorMessage);
      return false;
    } finally {
      state.cloudBackupRunning = false;
      refreshCloudBackupKeyGuide();
    }
  }

  function formatCloudBackupSaveError(error) {
    const cloudData = error && error.cloudData ? error.cloudData : {};
    if (cloudData.error === 'backup owner mismatch') {
      return '该备份密钥不可用于当前账号，请更换备份密钥';
    }
    if (cloudData.error === 'payload too large' || (error && error.message === 'payload too large')) {
      return '\u4e91\u5907\u4efd\u5206\u7ea7\u5feb\u7167\u5747\u8d85\u8fc7\u4e0a\u9650';
    }
    return error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
  }

  async function restoreCloudBackup() {
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      state.settings.cloudBackupKey = input.value.trim();
      saveSettings(state.settings);
    }
    const backupKey = getCloudBackupKey();
    if (!backupKey) {
      showToast(L.cloudBackupMissingKey);
      return;
    }
    if (backupKey.length < 4) {
      showToast(L.cloudBackupKeyTooShort);
      return;
    }
    if (!window.confirm('\u786e\u5b9a\u8981\u4ece\u4e91\u5907\u4efd\u6062\u590d\u6570\u636e\u5417\uff1f')) return;
    setCloudBackupStatus(L.cloudBackupRestoring);
    showToast(L.cloudBackupRestoring);
    try {
      const response = await loadCloudBackupRecord(backupKey);
      if (!response || !response.found) {
        setCloudBackupStatus(L.cloudBackupNotFound);
        showToast(L.cloudBackupNotFound);
        return;
      }
      importCachePayload(await decodeCloudBackupPayload(response.payload, backupKey));
      saveSettings(state.settings);
      setCloudBackupStatus(L.cloudBackupRestored + '\uff1a' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u6062\u590d\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      showToast(L.cloudBackupRestored);
      state.view = 'about';
      renderShell();
    } catch (error) {
      console.warn('PLM floating helper cloud backup restore failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
      addLog('error', '\u4e91\u5907\u4efd\u6062\u590d\u5931\u8d25', error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef');
      showToast(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
    }
  }

  function buildPackBoxKey(data) {
    if (!data) return '';
    const source = shouldUseProductSizeForPacking(data)
      ? [data.productLength, data.productWidth, data.productHeight]
      : [data.packageLength, data.packageWidth, data.packageHeight];
    const parts = source
      .map((value) => normalizePackDimensionPart(value))
      .filter(Boolean);
    return parts.length === 3 ? parts.join('x') : '';
  }

  function calculateLocalPackRecommendation(boxKey) {
    const itemDims = String(boxKey || '')
      .split('x')
      .map((part) => Number(part));
    if (itemDims.length !== 3 || itemDims.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    const cartonDims = [56, 36, 21];
    const permutations = [
      [itemDims[0], itemDims[1], itemDims[2]],
      [itemDims[0], itemDims[2], itemDims[1]],
      [itemDims[1], itemDims[0], itemDims[2]],
      [itemDims[1], itemDims[2], itemDims[0]],
      [itemDims[2], itemDims[0], itemDims[1]],
      [itemDims[2], itemDims[1], itemDims[0]],
    ];
    const best = permutations.reduce((current, dims) => {
      const count = Math.floor(cartonDims[0] / dims[0])
        * Math.floor(cartonDims[1] / dims[1])
        * Math.floor(cartonDims[2] / dims[2]);
      return count > current.packCount ? { packCount: count, orientation: dims.join('x') } : current;
    }, { packCount: 0, orientation: '' });
    if (!best.packCount) return null;
    return {
      boxKey,
      packCount: best.packCount,
      orientation: best.orientation,
      cartonKey: cartonDims.join('x'),
      source: 'local-calc',
    };
  }

  function getLocalPackQty(data) {
    const boxKey = buildPackBoxKey(data);
    const recommendation = calculateLocalPackRecommendation(boxKey);
    return recommendation && recommendation.packCount ? String(recommendation.packCount) : '';
  }

  function shouldUseProductSizeForPacking(data) {
    return Boolean(data && data.singleBottle && !/纸盒/.test(String(data.packageSizeLabel || '')));
  }

  function shouldRemoveExcelPackageSizeColumn(data) {
    return shouldUseProductSizeForPacking(data);
  }

  function normalizePackDimensionPart(value) {
    const text = String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\u5398\u7c73|\u516c\u5206/g, 'cm')
      .replace(/[\u00d7*]/g, 'x');
    const cmPart = text.split('/')[0].replace(/cm/g, '');
    const match = cmPart.match(/\d+(?:\.\d+)?/);
    if (!match) return '';
    const number = Number(match[0]);
    return Number.isFinite(number) && number > 0 ? trimNumber(number) : '';
  }
