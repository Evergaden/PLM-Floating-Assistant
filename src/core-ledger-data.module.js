
  function getTodayKey() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  function normalizeLedgerDate(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return '';
    return [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-');
  }

  function shiftDateKey(value, delta) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const date = new Date(key + 'T00:00:00');
    date.setDate(date.getDate() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function shiftLedgerMonth(value, delta) {
    const month = normalizeLedgerMonth(value || getTodayKey());
    const match = month.match(/^(\d{4})-(\d{2})$/);
    const date = new Date(match ? Number(match[1]) : new Date().getFullYear(), match ? Number(match[2]) - 1 : new Date().getMonth(), 1);
    date.setMonth(date.getMonth() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), '01'].join('-');
  }

  function formatLedgerDateLabel(value) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const parts = key.split('-');
    return Number(parts[1]) + '\u6708' + Number(parts[2]) + '\u65e5';
  }

  function formatLedgerMinuteLabel(value, fallbackDate) {
    const ms = parseLedgerDateTimeMs(value);
    if (ms) {
      const date = new Date(ms);
      return (date.getMonth() + 1) + '\u6708' + date.getDate() + '\u65e5 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
    return formatLedgerDateLabel(fallbackDate || value);
  }

  function getNowLedgerMinuteLabel() {
    return formatLedgerMinuteLabel(Date.now());
  }

  function parseLedgerDateTimeMs(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    const text = String(value || '').trim();
    if (!text || text === '--') return 0;
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (full) {
      const date = new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]), Number(full[4] || 0), Number(full[5] || 0), 0, 0);
      return date.getTime();
    }
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (cn) {
      const date = new Date(new Date().getFullYear(), Number(cn[1]) - 1, Number(cn[2]), Number(cn[3] || 0), Number(cn[4] || 0), 0, 0);
      return date.getTime();
    }
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseLedgerDateFromText(value) {
    const text = String(value || '').trim();
    if (!text || text === '--') return '';
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (full) return [full[1], full[2].padStart(2, '0'), full[3].padStart(2, '0')].join('-');
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5/);
    if (cn) return [String(new Date().getFullYear()), cn[1].padStart(2, '0'), cn[2].padStart(2, '0')].join('-');
    return normalizeLedgerDate(text);
  }

  function getMonthKeyFromDateKey(value) {
    const key = normalizeLedgerDate(value) || parseLedgerDateFromText(value) || getTodayKey();
    return key.slice(0, 7);
  }

  function normalizeLedgerMonth(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})$/);
    if (match) return match[1] + '-' + match[2].padStart(2, '0');
    return getMonthKeyFromDateKey(text);
  }

  function getCurrentLedgerMonth() {
    return normalizeLedgerMonth(state.ledgerDate || getTodayKey());
  }

  function getLedgerDesignDate(record) {
    return parseLedgerDateFromText(record && record.designAssignedAt) || normalizeLedgerDate(record && record.date) || getTodayKey();
  }

  function getLedgerFinalizedDate(record) {
    return normalizeLedgerDate(record && record.finalizedDate)
      || parseLedgerDateFromText(record && record.finalizedAt)
      || (record && record.status === '作废' ? parseLedgerDateFromText(record.updatedAt) : '')
      || getLedgerDesignDate(record);
  }

  function isLedgerFinalizedRecord(record) {
    return Boolean(record && (record.finalizedAt || record.status === '作废'));
  }

  function loadDailyLedger() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_KEY) || 'null');
      return sanitizeLedgerRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedger() {
    try {
      state.ledgerRecords = sanitizeLedgerRecords(state.ledgerRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_KEY, state.ledgerRecords);
      else localStorage.setItem(DAILY_LEDGER_KEY, JSON.stringify(state.ledgerRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger save failed:', error);
    }
  }

  function loadLedgerSeriesExcludedSkus() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(DAILY_LEDGER_SERIES_EXCLUDED_KEY, null)
        : JSON.parse(localStorage.getItem(DAILY_LEDGER_SERIES_EXCLUDED_KEY) || 'null');
      return new Set((Array.isArray(saved) ? saved : []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean));
    } catch (error) {
      return new Set();
    }
  }

  function saveLedgerSeriesExcludedSkus() {
    const values = Array.from(state.ledgerSeriesExcludedSkus || []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean).slice(0, 1200);
    try {
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_SERIES_EXCLUDED_KEY, values);
      else localStorage.setItem(DAILY_LEDGER_SERIES_EXCLUDED_KEY, JSON.stringify(values));
    } catch (error) {
      console.warn('PLM floating helper ledger series exclusion save failed:', error);
    }
  }

  function startDailyLedgerSync() {
    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(DAILY_LEDGER_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerRecords = filterLedgerRecordsNotInTrash(newValue);
        if (state.view === 'ledger') renderShell();
      });
      GM_addValueChangeListener(DAILY_LEDGER_TRASH_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerTrashRecords = sanitizeLedgerTrashRecords(newValue);
        state.ledgerRecords = filterLedgerRecordsNotInTrash(state.ledgerRecords);
        if (state.view === 'ledger') renderShell();
      });
      GM_addValueChangeListener(DAILY_LEDGER_SERIES_EXCLUDED_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerSeriesExcludedSkus = new Set((Array.isArray(newValue) ? newValue : []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean));
        if (state.view === 'ledger') renderShell();
      });
    }
    window.addEventListener('storage', (event) => {
      if (typeof GM_getValue === 'function') return;
      try {
        if (event.key === DAILY_LEDGER_SERIES_EXCLUDED_KEY) {
          const values = JSON.parse(event.newValue || '[]');
          state.ledgerSeriesExcludedSkus = new Set((Array.isArray(values) ? values : []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean));
        } else if (event.key === DAILY_LEDGER_KEY) {
          state.ledgerRecords = filterLedgerRecordsNotInTrash(JSON.parse(event.newValue || '[]'));
        } else {
          return;
        }
        if (state.view === 'ledger') renderShell();
      } catch (_) {}
    });
  }

  function syncDailyLedgerBeforeMutation() {
    state.ledgerTrashRecords = loadDailyLedgerTrash();
    state.ledgerRecords = filterLedgerRecordsNotInTrash(loadDailyLedger()).slice(0, 1200);
  }

  function loadDailyLedgerTrash() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_TRASH_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_TRASH_KEY) || 'null');
      return sanitizeLedgerTrashRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedgerTrash() {
    try {
      state.ledgerTrashRecords = sanitizeLedgerTrashRecords(state.ledgerTrashRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_TRASH_KEY, state.ledgerTrashRecords);
      else localStorage.setItem(DAILY_LEDGER_TRASH_KEY, JSON.stringify(state.ledgerTrashRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger trash save failed:', error);
    }
  }

  function sanitizeLedgerTrashRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => {
      const record = sanitizeLedgerRecords([item])[0];
      if (!record) return null;
      return {
        ...record,
        removedAt: String(item.removedAt || item.updatedAt || new Date().toLocaleString()).slice(0, 80),
        removedAtMs: Number(item.removedAtMs || item.updatedAtMs || 0) || Date.now(),
        purged: Boolean(item.purged),
      };
    }).filter(Boolean);
  }

  function isLedgerRecordTrashed(sku, dateKey) {
    const month = getMonthKeyFromDateKey(normalizeLedgerDate(dateKey) || getTodayKey());
    return (state.ledgerTrashRecords || []).some((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month);
  }

  function filterLedgerRecordsNotInTrash(records) {
    return sanitizeLedgerRecords(records).filter((item) => !isLedgerRecordTrashed(item.sku, item.date));
  }

  function sanitizeLedgerRecords(records) {
    const normalized = (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => ({
      date: normalizeLedgerDate(item.date) || getTodayKey(),
      sku: String(item.sku || '').slice(0, 80),
      brand: cleanName(item.brand || '').slice(0, 120),
      name: cleanName(item.name || '').slice(0, 220),
      skuImageUrl: String(item.skuImageUrl || '').slice(0, 600),
      benchmarkImageUrl: String(item.benchmarkImageUrl || '').slice(0, 600),
      designType: cleanName(item.designType || '').slice(0, 80),
      artPriority: cleanName(item.artPriority || '').slice(0, 80),
      referenceUrl: String(item.referenceUrl || '').slice(0, 800),
      developerName: cleanName(item.developerName || '').slice(0, 80),
      designAssignedAt: String(item.designAssignedAt || '').slice(0, 80),
      developmentAssignedAt: String(item.developmentAssignedAt || '').slice(0, 80),
      performanceGroupId: String(item.performanceGroupId || '').slice(0, 80),
      performanceGroupMode: item.performanceGroupMode === 'series' ? 'series' : '',
      performanceType: item.performanceType === 'extension' ? 'extension' : '',
      seriesExcluded: Boolean(item.seriesExcluded),
      isToy: Boolean(item.isToy),
      packageCode: String(item.packageCode || '').slice(0, 120),
      printCode: String(item.printCode || '').slice(0, 180),
      purchasePrice: normalizeLedgerPurchasePrice(item.purchasePrice),
      boxFileState: normalizeLedgerFileState(item.boxFileState, item.boxFileDone),
      labelFileState: normalizeLedgerFileState(item.labelFileState, item.labelFileDone),
      imagePackState: normalizeLedgerFileState(item.imagePackState, item.imagePackDone),
      artworkState: normalizeLedgerArtworkState(item.artworkState),
      aiImageStatus: normalizeLedgerAiImageStatus(item.aiImageStatus, item.aiImageMessage),
      aiImageMessage: String(item.aiImageMessage || '').slice(0, 180),
      aiImageJobId: String(item.aiImageJobId || '').slice(0, 120),
      aiImageCheckedAtMs: Number(item.aiImageCheckedAtMs || 0) || 0,
      aiMainImages: normalizeLedgerAiImageItems(item.aiMainImages, 12),
      aiDetailImages: normalizeLedgerAiImageItems(item.aiDetailImages, 20),
      aiMainRetouchedImages: normalizeLedgerAiImageItems(item.aiMainRetouchedImages || item.aiMainEditedImages, LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiDetailRetouchedImages: normalizeLedgerAiImageItems(item.aiDetailRetouchedImages || item.aiDetailEditedImages, LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiMainRetouchTasks: normalizeLedgerAiImageRetouchTasks(item.aiMainRetouchTasks, LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiDetailRetouchTasks: normalizeLedgerAiImageRetouchTasks(item.aiDetailRetouchTasks, LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiMainHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(item.aiMainHiddenImageKeys, LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetailHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(item.aiDetailHiddenImageKeys, LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetail3Audit: normalizeLedgerDetail3Audit(item.aiDetail3Audit),
      boxFileDone: normalizeLedgerFileState(item.boxFileState, item.boxFileDone) === 'done',
      labelFileDone: normalizeLedgerFileState(item.labelFileState, item.labelFileDone) === 'done',
      imagePackDone: normalizeLedgerFileState(item.imagePackState, item.imagePackDone) === 'done',
      filesAutoCompleted: Boolean(item.filesAutoCompleted),
      status: normalizeLedgerStatus(item.status),
      stage: String(item.stage || '').slice(0, 80) || '待定稿',
      imageGeneratedAt: String(item.imageGeneratedAt || '').slice(0, 40),
      imageGeneratedAtMs: Number(item.imageGeneratedAtMs || 0) || parseLedgerDateTimeMs(item.imageGeneratedAt) || 0,
      finalizedAt: String(item.finalizedAt || '').slice(0, 40),
      finalizedDate: normalizeLedgerDate(item.finalizedDate) || '',
      finalizedAtMs: Number(item.finalizedAtMs || 0) || parseLedgerDateTimeMs(item.finalizedAt) || 0,
      note: String(item.note || '').slice(0, 240),
      createdAt: String(item.createdAt || new Date().toLocaleString()).slice(0, 80),
      createdAtMs: Number(item.createdAtMs || item.updatedAtMs || 0) || Date.now(),
      updatedAt: String(item.updatedAt || new Date().toLocaleString()).slice(0, 80),
      updatedAtMs: Number(item.updatedAtMs || 0) || Date.now(),
    })).map(reconcileLedgerFileCompletion).filter((item) => item.sku);
    return dedupeLedgerRecords(normalized);
  }

  function normalizeLedgerFileState(value, doneFallback) {
    const text = String(value || '').trim();
    if (/^(pending|done|skip)$/.test(text)) return text;
    if (/^(?:\u5b8c\u6210|\u5df2\u5b8c\u6210|done)$/i.test(text)) return 'done';
    if (/^(?:\u4e0d\u9700\u8981|\u65e0\u9700|\u8df3\u8fc7|skip)$/i.test(text)) return 'skip';
    return doneFallback ? 'done' : 'pending';
  }

  function normalizeLedgerArtworkState(value) {
    return /^(pending|doing|done)$/.test(String(value || '')) ? String(value) : 'pending';
  }

  function isLedgerAiImageCopywritingError(value) {
    return /缺少产品文案|产品文案.{0,12}(缺少|为空|不存在)|missing.{0,18}copy(?:writing|write)/i.test(String(value || ''));
  }

  function isLedgerAiImageSkuImageError(value) {
    const text = String(value || '');
    return /(?:缺少|缺失|为空|未找到|无法确认|未检测到)[^。\n]{0,28}(?:SKU\s*(?:效果图|图)|SKU图)/i.test(text)
      || /(?:SKU\s*(?:效果图|图)|SKU图)[^。\n]{0,28}(?:缺少|缺失|为空|未找到|无法确认|未检测到)/i.test(text);
  }

  function normalizeLedgerAiImageStatus(value, message) {
    const status = String(value || '').trim();
    if (status === 'error') {
      const copywritingError = isLedgerAiImageCopywritingError(message);
      const skuImageError = isLedgerAiImageSkuImageError(message);
      if (copywritingError && skuImageError) return 'needs-prerequisites';
      if (skuImageError) return 'needs-sku-image';
      if (copywritingError) return 'needs-copywriting';
    }
    return /^(unknown|loading|running|success|empty|error|needs-copywriting|needs-sku-image|needs-prerequisites|task-error|result-missing)$/.test(status) ? status : 'unknown';
  }

  function getLedgerAiImageSourceFilename(item) {
    const source = item && typeof item === 'object' ? item : { url: item };
    const explicit = String(source.filename || source.fileName || source.baseFilename || source.originalFilename || '').trim();
    const raw = explicit || String(source.url || source.imageUrl || source.path || source.sourceUrl || source.baseUrl || '').trim();
    if (!raw) return '';
    let filename = raw;
    try {
      if (/^https?:/i.test(raw)) filename = new URL(raw, window.location.origin).pathname.split('/').pop() || raw;
    } catch (_) {
      filename = raw;
    }
    filename = filename.split(/[\\/]/).pop() || filename;
    filename = filename.split(/[?#]/)[0] || filename;
    try { return decodeURIComponent(filename).trim(); } catch (_) { return filename.trim(); }
  }

  function getLedgerAiImageFilenameStem(item) {
    return getLedgerAiImageSourceFilename(item).replace(/\.[^.]+$/, '').trim();
  }

  function getLedgerAiImageSequence(item) {
    const source = item && typeof item === 'object' ? item : { url: item };
    const stem = getLedgerAiImageFilenameStem(source);
    const names = [
      source.displayName,
      source.logicalName,
      source.slotName,
      source.baseFilename,
      source.originalFilename,
      source.filename,
      stem,
    ].map((value) => String(value || '').trim()).filter(Boolean);
    const labelPattern = /(?:主图|详情图)\s*[-_# ]*(\d+)/;
    for (const name of names) {
      const match = name.match(labelPattern);
      const sequence = Number(match && match[1]);
      if (Number.isFinite(sequence) && sequence > 0) return Math.floor(sequence);
    }
    const rule = stem && LEDGER_AI_IMAGE_RENAME_RULES.find((candidate) => candidate.pattern.test(stem));
    const ruleSequence = String(rule && rule.name || '').match(/(\d+)$/);
    if (ruleSequence) return Number(ruleSequence[1]);
    const explicit = [source.sequence, source.sortIndex]
      .map((value) => Number(value))
      .find((value) => Number.isFinite(value) && value > 0);
    if (explicit) return Math.floor(explicit);
    const patterns = [
      /(?:^|[-_ ])(?:main|detail)[-_ ]*(\d+)/i,
      /(?:main|detail)[-_ ]*prompt[-_ ]*(\d+)/i,
      /prompt[-_ ]*(\d+)/i,
    ];
    for (const name of names) {
      for (const pattern of patterns) {
        const match = name.match(pattern);
        const sequence = Number(match && match[1]);
        if (Number.isFinite(sequence) && sequence > 0) return Math.floor(sequence);
      }
    }
    const positional = [source.order, source.index]
      .map((value) => Number(value))
      .find((value) => Number.isFinite(value) && value > 0);
    return positional ? Math.floor(positional) : 0;
  }

  function compareLedgerAiImageItems(left, right) {
    const leftSequence = getLedgerAiImageSequence(left);
    const rightSequence = getLedgerAiImageSequence(right);
    if (leftSequence && rightSequence && leftSequence !== rightSequence) return leftSequence - rightSequence;
    if (leftSequence !== rightSequence) return leftSequence ? -1 : 1;
    const leftCreated = Number(left && left.createdAtMs || 0);
    const rightCreated = Number(right && right.createdAtMs || 0);
    if (leftCreated && rightCreated && leftCreated !== rightCreated) return leftCreated - rightCreated;
    return String(getLedgerAiImageSourceFilename(left) || left && left.url || '')
      .localeCompare(String(getLedgerAiImageSourceFilename(right) || right && right.url || ''), 'zh-CN', { numeric: true });
  }

  function getLedgerAiImageDisplayName(item, kind, index) {
    const source = item && typeof item === 'object' ? item : { url: item };
    const explicitDisplayName = String(source.displayName || source.logicalName || source.slotName || '').trim();
    if (explicitDisplayName) return explicitDisplayName.replace(/\.[^.]+$/, '');
    const sequence = getLedgerAiImageSequence(source);
    const fallback = (kind === 'detail' ? '详情图' : '主图') + (sequence || Number(index) + 1);
    const stem = getLedgerAiImageFilenameStem(item);
    const rule = stem && LEDGER_AI_IMAGE_RENAME_RULES.find((candidate) => candidate.pattern.test(stem));
    return rule ? rule.name : fallback;
  }

  function getLedgerAiImageExtension(item, blob) {
    const sourceFilename = getLedgerAiImageSourceFilename(item);
    const filenameMatch = sourceFilename.match(/\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i);
    if (filenameMatch) return '.' + filenameMatch[1].toLowerCase();
    const type = String(blob && blob.type || '').toLowerCase().split(';')[0];
    const typeMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/avif': '.avif',
      'image/svg+xml': '.svg',
    };
    return typeMap[type] || '.png';
  }

  function normalizeLedgerAiImageItems(value, limit) {
    const max = Number(limit) > 0 ? Number(limit) : 12;
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map((item, sourceIndex) => {
      const source = item && typeof item === 'object' ? item : { url: item };
      const rawUrl = String(source.url || source.imageUrl || source.path || '').trim();
      if (!rawUrl) return null;
      let url = '';
      try {
        const parsed = new URL(rawUrl, window.location.origin);
        if (!/^https?:$/.test(parsed.protocol)) return null;
        url = parsed.href;
      } catch (_) {
        return null;
      }
      if (url.length > 1600 || seen.has(url)) return null;
      seen.add(url);
      const fallbackName = url.split('/').pop().split('?')[0];
      const normalized = {
        url,
        filename: String(source.filename || source.fileName || fallbackName || '').slice(0, 180),
      };
      const displayName = String(source.displayName || source.logicalName || source.slotName || '').trim();
      const baseUrl = String(source.baseUrl || source.originalUrl || '').trim();
      const parentUrl = String(source.parentUrl || source.sourceUrl || '').trim();
      const baseFilename = String(source.baseFilename || source.originalFilename || '').trim();
      const prompt = String(source.prompt || '').trim();
      const createdAt = String(source.createdAt || '').trim();
      const createdAtMs = Number(source.createdAtMs || 0) || 0;
      const sequence = getLedgerAiImageSequence(source);
      if (displayName) normalized.displayName = displayName.slice(0, 80);
      if (baseUrl) normalized.baseUrl = baseUrl.slice(0, 1600);
      if (parentUrl) normalized.parentUrl = parentUrl.slice(0, 1600);
      if (baseFilename) normalized.baseFilename = baseFilename.slice(0, 180);
      if (prompt) normalized.prompt = prompt.slice(0, 1000);
      if (createdAt) normalized.createdAt = createdAt.slice(0, 80);
      if (createdAtMs) normalized.createdAtMs = createdAtMs;
      if (sequence) normalized.sequence = sequence;
      normalized._sourceIndex = sourceIndex;
      return normalized;
    }).filter(Boolean).sort((left, right) => {
      const compared = compareLedgerAiImageItems(left, right);
      return compared || left._sourceIndex - right._sourceIndex;
    }).map((item) => {
      const normalized = { ...item };
      delete normalized._sourceIndex;
      return normalized;
    }).filter(Boolean).slice(0, max);
  }

  function normalizeLedgerAiImageHiddenKeys(value, limit) {
    const max = Number(limit) > 0 ? Number(limit) : LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS;
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map((item) => {
      const raw = String(item || '').trim();
      if (!raw) return '';
      if (/^task:/i.test(raw)) {
        const id = raw.slice(raw.indexOf(':') + 1).trim().slice(0, 180);
        return id ? 'task:' + id : '';
      }
      const imageRaw = /^image:/i.test(raw) ? raw.slice(raw.indexOf(':') + 1).trim() : raw;
      const normalized = normalizeLedgerAiImageItems([{ url: imageRaw }], 1)[0];
      return normalized ? 'image:' + normalized.url : '';
    }).filter((key) => {
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, max);
  }

  function normalizeLedgerAiImageRetouchTasks(value, limit) {
    const max = Number(limit) > 0 ? Number(limit) : LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS;
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map((item, sourceIndex) => {
      const source = item && typeof item === 'object' ? item : {};
      const sourceUrl = String(source.sourceUrl || source.imageUrl || source.url || '').trim();
      const prompt = String(source.prompt || '').trim();
      if (!sourceUrl || !prompt) return null;
      const id = String(source.id || [sourceUrl, prompt, source.createdAtMs || sourceIndex].join('|')).slice(0, 180);
      if (seen.has(id)) return null;
      seen.add(id);
      const status = /^(running|success|error)$/.test(String(source.status || '')) ? String(source.status) : 'running';
      return {
        id,
        sourceUrl: sourceUrl.slice(0, 1600),
        displayName: String(source.displayName || source.logicalName || source.slotName || '').slice(0, 80),
        baseFilename: String(source.baseFilename || source.originalFilename || '').slice(0, 180),
        sequence: getLedgerAiImageSequence(source) || 0,
        prompt: prompt.slice(0, 1000),
        status,
        error: String(source.error || '').slice(0, 240),
        createdAt: String(source.createdAt || '').slice(0, 80),
        createdAtMs: Number(source.createdAtMs || 0) || 0,
        updatedAtMs: Number(source.updatedAtMs || source.createdAtMs || 0) || 0,
        _sourceIndex: sourceIndex,
      };
    }).filter(Boolean).sort((left, right) => {
      const leftTime = Number(left.createdAtMs || left.updatedAtMs || 0);
      const rightTime = Number(right.createdAtMs || right.updatedAtMs || 0);
      return rightTime - leftTime || left._sourceIndex - right._sourceIndex;
    }).map((item) => {
      const normalized = { ...item };
      delete normalized._sourceIndex;
      return normalized;
    }).slice(0, max);
  }

  function localizeLedgerDetail3AuditText(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^The image contains no ingredient list\b.*verify the expected ingredients/i.test(text)) return '图片中没有成分列表，无法核对预期成分。';
    if (/^No ingredient list is present on the packaging\b.*image/i.test(text)) return '包装或图片文字中没有成分列表。';
    if (/^The English ingredients shown in the image match the expected copy/i.test(text)) return '图片中的英文成分与预期文案一致。';
    if (/^The English ingredient text in the image could not be read reliably/i.test(text)) return '图片中的英文成分文字无法可靠识别。';
    if (/^The ingredient image needs review because discrepancies or generation anomalies were found/i.test(text)) return '成分图存在缺漏、重复或显示异常，需要检查。';
    if (/^The image displays materials instead of cosmetic ingredients/i.test(text)) return '图片中的名称已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/^No English ingredients provided in the expected list/i.test(text)) return '预期成分已按图片中的实际名称进行对照。';
    if (/^The image lists materials\s*\(([^)]+)\) rather than cosmetic ingredients/i.test(text)) return '图片中的名称（' + text.replace(/^The image lists materials\s*\(([^)]+)\).*$/i, '$1') + '）已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/^The image displays materials\s*\(([^)]+)\) rather than cosmetic ingredients/i.test(text)) return '图片中的名称（' + text.replace(/^The image displays materials\s*\(([^)]+)\).*$/i, '$1') + '）已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/^The expected ingredient list provided is in Chinese/i.test(text)) return '预期成分已按图片中的实际名称进行对照。';
    if (/expected ingredient list.*Chinese.*not English/i.test(text)) return '预期成分已按图片中的实际名称进行对照。';
    if (/image (?:text|labels?) is in English/i.test(text)) return '图片中的文字为英文。';
    if (/materials?.*rather than cosmetic ingredients/i.test(text)) return '图片中的名称已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/image type does not match its content|image bytes are not a supported/i.test(text)) return '图片格式与内容不匹配，请重新上传有效的 JPEG、PNG 或 WebP 图片。';
    if (/image is too large/i.test(text)) {
      const limit = (text.match(/max\s+([^\)]+)/i) || [])[1];
      return limit ? '图片文件过大（上限 ' + limit.trim() + '），请压缩图片后重试。' : '图片文件过大，请压缩后重试。';
    }
    if (/insufficient balance/i.test(text)) return 'AI 视觉服务余额不足，请检查服务配置后重试。';
    if (/timeout|operation was aborted/i.test(text)) return 'AI 视觉服务请求超时，请稍后重试。';
    return text;
  }

  function normalizeLedgerDetail3Audit(value) {
    const source = value && typeof value === 'object' ? value : {};
    const list = (items, limit) => Array.from(new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))).slice(0, limit || 30);
    const isIgnoredFinding = (value) => /材料.*(?:化妆品|成分)|materials?.*(?:cosmetic ingredients|rather than)|No English ingredients provided in the expected list|expected ingredient list.*Chinese.*(?:not English|while the image text is English)|预期成分(?:列表为中文|已按图片中的实际名称进行对照)|提供的预期成分列表为中文/i.test(String(value || ''));
    const rawStatus = String(source.status || '').toLowerCase();
    const summary = localizeLedgerDetail3AuditText(String(source.summary || '').slice(0, 500));
    const missing = list(source.missing || source.missingInImage, 40).map(localizeLedgerDetail3AuditText).filter((item) => !isIgnoredFinding(item));
    const duplicates = list(source.duplicates, 40).map(localizeLedgerDetail3AuditText);
    const anomalies = list(source.anomalies || source.visualIssues || source.spellingIssues, 40)
      .map(localizeLedgerDetail3AuditText)
      .filter((item) => !isIgnoredFinding(item));
    const hasExtraFinding = list(source.extra || source.unexpectedInImage, 40).length > 0;
    const ignoredOnlyFinding = [
      source.summary,
      ...(Array.isArray(source.extra) ? source.extra : [source.extra]),
      ...(Array.isArray(source.missing) ? source.missing : [source.missing]),
      ...(Array.isArray(source.anomalies) ? source.anomalies : [source.anomalies]),
    ].some(isIgnoredFinding);
    const status = (ignoredOnlyFinding || hasExtraFinding) && !missing.length && !duplicates.length && !anomalies.length
      ? 'pass'
      : (rawStatus === 'fail' || rawStatus === 'unreadable'
        ? 'warning'
        : (/^(?:idle|loading|pass|warning|error)$/.test(rawStatus) ? rawStatus : 'idle'));
    return {
      status,
      summary,
      imageUrl: String(source.imageUrl || '').slice(0, 1600),
      expectedIngredients: String(source.expectedIngredients || '').slice(0, 4000),
      extractedIngredients: list(source.extractedIngredients || source.recognizedEnglishIngredients, 60),
      missing,
      // Readable labels are valid even when they describe a material rather
      // than a cosmetic ingredient. Do not render legacy category-based
      // "extra/incorrect" findings from older audit responses.
      extra: [],
      duplicates,
      anomalies,
      provider: String(source.provider || '').slice(0, 80),
      model: String(source.model || '').slice(0, 120),
      retryable: Boolean(source.retryable),
      checkedAtMs: Number(source.checkedAtMs || 0) || 0,
    };
  }

  function normalizeLedgerPurchasePrice(value) {
    const text = String(value === undefined || value === null ? '' : value).trim().replace(/^¥\s*/, '');
    if (!text) return '';
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return '';
    const number = Number(text);
    return Number.isFinite(number) && number >= 0 ? String(number) : '';
  }

  function nextLedgerFileState(value, doneFallback) {
    const current = normalizeLedgerFileState(value, doneFallback);
    if (current === 'pending') return 'done';
    if (current === 'done') return 'skip';
    return 'pending';
  }

  function ledgerFileStateLabel(value) {
    const stateValue = normalizeLedgerFileState(value);
    if (stateValue === 'done') return '\u5df2\u5b8c\u6210';
    if (stateValue === 'skip') return '\u4e0d\u9700\u8981\u5236\u4f5c\u6587\u4ef6';
    return '\u672a\u5b8c\u6210';
  }

  function reconcileLedgerFileCompletion(record) {
    const allFilesDone = ['boxFileState', 'labelFileState', 'imagePackState']
      .every((field) => normalizeLedgerFileState(record[field]) === 'done');
    if (record.finalizedAt && record.status === '已定稿' && allFilesDone) {
      return { ...record, status: '已完成', stage: '完成', filesAutoCompleted: true };
    }
    if (record.filesAutoCompleted && record.status === '已完成' && !allFilesDone) {
      return { ...record, status: '已定稿', stage: '已定稿', filesAutoCompleted: false };
    }
    return record;
  }

  function getLedgerSkuKey(value) {
    return String(value || '').trim().toUpperCase();
  }

  function hasLedgerRecordValue(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    return String(value).trim() !== '';
  }

  function getLedgerRecordActivityMs(record) {
    const candidates = [
      record && record.updatedAtMs,
      record && record.updatedAt,
      record && record.finalizedAtMs,
      record && record.finalizedAt,
      record && record.createdAtMs,
      record && record.createdAt,
      record && record.date,
    ];
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
      const parsed = parseLedgerDateTimeMs(candidate);
      if (parsed > 0) return parsed;
    }
    return 0;
  }

  function getLedgerRecordFinalizedMs(record) {
    const numeric = Number(record && record.finalizedAtMs);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const parsed = parseLedgerDateTimeMs(record && record.finalizedAt);
    return parsed || getLedgerRecordActivityMs(record);
  }

  function getLedgerRecordCreatedMs(record) {
    const numeric = Number(record && record.createdAtMs);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return parseLedgerDateTimeMs(record && record.createdAt) || getLedgerRecordActivityMs(record);
  }

  function mergeLedgerFileStates(records, field) {
    const states = records.map((item) => normalizeLedgerFileState(item && item[field]));
    if (states.includes('done')) return 'done';
    if (states.includes('skip')) return 'skip';
    return 'pending';
  }

  function mergeLedgerArtworkStates(records) {
    const states = records.map((item) => normalizeLedgerArtworkState(item && item.artworkState));
    if (states.includes('done')) return 'done';
    if (states.includes('doing')) return 'doing';
    return 'pending';
  }

  function mergeLedgerRecordGroup(records) {
    const items = (Array.isArray(records) ? records : []).filter((item) => item && item.sku);
    if (!items.length) return null;
    const finalizedItems = items.filter(isLedgerFinalizedRecord);
    const candidates = (finalizedItems.length ? finalizedItems : items).slice().sort((a, b) => {
      const timeA = finalizedItems.length ? getLedgerRecordFinalizedMs(a) : getLedgerRecordActivityMs(a);
      const timeB = finalizedItems.length ? getLedgerRecordFinalizedMs(b) : getLedgerRecordActivityMs(b);
      return timeB - timeA;
    });
    const winner = candidates[0] || items[0];
    const recentItems = items.slice().sort((a, b) => getLedgerRecordActivityMs(b) - getLedgerRecordActivityMs(a));
    const merged = { ...winner };
    [
      'brand', 'name', 'skuImageUrl', 'benchmarkImageUrl', 'designType', 'artPriority',
      'referenceUrl', 'developerName', 'developmentAssignedAt', 'performanceGroupId', 'performanceGroupMode',
      'packageCode', 'printCode', 'purchasePrice', 'imageGeneratedAt', 'imageGeneratedAtMs',
      'aiImageStatus', 'aiImageMessage', 'aiImageJobId', 'aiImageCheckedAtMs', 'aiMainImages', 'aiDetailImages',
      'aiMainRetouchedImages', 'aiDetailRetouchedImages', 'aiMainRetouchTasks', 'aiDetailRetouchTasks',
      'aiMainHiddenImageKeys', 'aiDetailHiddenImageKeys',
      'aiDetail3Audit',
    ].forEach((field) => {
      const source = recentItems.find((item) => hasLedgerRecordValue(item[field]));
      if (source) merged[field] = source[field];
    });
    if (!merged.performanceType) {
      const extension = recentItems.find((item) => item.performanceType === 'extension');
      if (extension) merged.performanceType = 'extension';
    }
    merged.seriesExcluded = items.some((item) => Boolean(item.seriesExcluded));
    merged.isToy = items.some((item) => Boolean(item.isToy));
    merged.boxFileState = mergeLedgerFileStates(items, 'boxFileState');
    merged.labelFileState = mergeLedgerFileStates(items, 'labelFileState');
    merged.imagePackState = mergeLedgerFileStates(items, 'imagePackState');
    merged.artworkState = mergeLedgerArtworkStates(items);
    merged.boxFileDone = merged.boxFileState === 'done';
    merged.labelFileDone = merged.labelFileState === 'done';
    merged.imagePackDone = merged.imagePackState === 'done';
    if (!hasLedgerRecordValue(merged.note)) {
      const noteSource = recentItems.find((item) => hasLedgerRecordValue(item.note));
      if (noteSource) merged.note = noteSource.note;
    }
    const oldest = items.slice().sort((a, b) => getLedgerRecordCreatedMs(a) - getLedgerRecordCreatedMs(b))[0];
    const latest = recentItems[0];
    if (oldest && hasLedgerRecordValue(oldest.createdAt)) merged.createdAt = oldest.createdAt;
    if (oldest && hasLedgerRecordValue(oldest.createdAtMs)) merged.createdAtMs = oldest.createdAtMs;
    if (latest && hasLedgerRecordValue(latest.updatedAt)) merged.updatedAt = latest.updatedAt;
    if (latest && hasLedgerRecordValue(latest.updatedAtMs)) merged.updatedAtMs = latest.updatedAtMs;
    return reconcileLedgerFileCompletion(merged);
  }

  function dedupeLedgerRecords(records) {
    const groups = new Map();
    (Array.isArray(records) ? records : []).forEach((record) => {
      const key = getLedgerSkuKey(record && record.sku);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });
    const output = [];
    groups.forEach((items) => {
      if (items.some(isLedgerFinalizedRecord)) {
        const merged = mergeLedgerRecordGroup(items);
        if (merged) output.push(merged);
        return;
      }
      const months = new Map();
      items.forEach((item) => {
        const month = getMonthKeyFromDateKey(item.date);
        if (!months.has(month)) months.set(month, []);
        months.get(month).push(item);
      });
      months.forEach((monthItems) => {
        const merged = mergeLedgerRecordGroup(monthItems);
        if (merged) output.push(merged);
      });
    });
    return output.sort((a, b) => getLedgerRecordActivityMs(b) - getLedgerRecordActivityMs(a)).slice(0, 1200);
  }

  function normalizeLedgerStatus(value) {
    const text = String(value || '').trim();
    return /^(待出图|待定稿|已定稿|制作中|已完成|异常|作废|跳过)$/.test(text) ? text : '待定稿';
  }

  function getLedgerRecordsForMonth(view, monthKey) {
    const month = normalizeLedgerMonth(monthKey || getTodayKey());
    if (view === 'trash') {
      return (state.ledgerTrashRecords || [])
        .filter((item) => !item.purged && getMonthKeyFromDateKey(item.date) === month)
        .sort((a, b) => (b.removedAtMs || b.updatedAtMs || 0) - (a.removedAtMs || a.updatedAtMs || 0));
    }
    const mode = view === 'finalized' ? 'finalized' : 'design';
    return (state.ledgerRecords || [])
      .filter((item) => {
        const finalized = isLedgerFinalizedRecord(item);
        if (mode === 'finalized' && !finalized) return false;
        if (mode === 'design' && finalized) return false;
        const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
        return getMonthKeyFromDateKey(key) === month;
      })
      .sort((a, b) => {
        const dateA = mode === 'finalized' ? getLedgerFinalizedDate(a) : getLedgerDesignDate(a);
        const dateB = mode === 'finalized' ? getLedgerFinalizedDate(b) : getLedgerDesignDate(b);
        if (dateA !== dateB) return dateA < dateB ? 1 : -1;
        if (mode === 'finalized') return (b.finalizedAtMs || b.createdAtMs || 0) - (a.finalizedAtMs || a.createdAtMs || 0);
        return (b.createdAtMs || b.updatedAtMs || 0) - (a.createdAtMs || a.updatedAtMs || 0);
      });
  }

  function groupLedgerRecordsByDate(records, view) {
    const mode = view === 'finalized' ? 'finalized' : 'design';
    const map = new Map();
    (records || []).forEach((item) => {
      const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }

  function shouldSkipLedgerDrawer(drawer) {
    const text = drawer ? compactText(getVisibleText(drawer)).replace(/\s+/g, '') : '';
    return /已完成|已作废|已拒绝/.test(text);
  }

  function hasMeaningfulLedgerRecordChange(previous, next) {
    const ignored = new Set(['updatedAt', 'updatedAtMs']);
    const comparable = (record) => Object.keys(record || {}).sort().reduce((result, key) => {
      if (!ignored.has(key)) result[key] = record[key];
      return result;
    }, {});
    return JSON.stringify(comparable(previous)) !== JSON.stringify(comparable(next));
  }

  function upsertDailyLedgerFromData(data, options) {
    if (!data || !data.sku) return null;
    const opts = options || {};
    if (!opts.skipStorageSync) syncDailyLedgerBeforeMutation();
    const assignedDate = parseLedgerDateFromText(data.designAssignedAt);
    const dateKey = normalizeLedgerDate(opts.date) || assignedDate || getTodayKey();
    if (opts.requireCurrentMonth && assignedDate && getMonthKeyFromDateKey(dateKey) !== getMonthKeyFromDateKey(getTodayKey())) return null;
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    const sku = data.sku;
    const dateMonth = getMonthKeyFromDateKey(dateKey);
    if (!opts.allowTrashRestore && isLedgerRecordTrashed(sku, dateKey)) return null;
    const existingInMonth = (state.ledgerRecords || []).find((item) => getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku) && getMonthKeyFromDateKey(item.date) === dateMonth);
    const finalizedExisting = (opts.status === '待定稿' || opts.status === undefined)
      ? (state.ledgerRecords || []).filter((item) => getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku) && isLedgerFinalizedRecord(item)).sort((a, b) => getLedgerRecordFinalizedMs(b) - getLedgerRecordFinalizedMs(a))[0]
      : null;
    const existing = finalizedExisting || existingInMonth;
    const preserveFinalizedState = Boolean(existing && isLedgerFinalizedRecord(existing) && (opts.status === '待定稿' || opts.status === undefined) && opts.finalizedAt === undefined);
    const imageUrl = getProductThumbUrl(data) || data.skuImageUrl || data.skuImageFallbackUrl || '';
    const next = {
      ...(existing || {}),
      date: dateKey,
      sku,
      brand: cleanName(data.brand || (existing && existing.brand) || ''),
      name: cleanName(data.name || (existing && existing.name) || ''),
      skuImageUrl: imageUrl || (existing && existing.skuImageUrl) || '',
      benchmarkImageUrl: String(data.benchmarkImageUrl || data.benchmarkImageFallbackUrl || (existing && existing.benchmarkImageUrl) || ''),
      designType: cleanName(data.designType || (existing && existing.designType) || ''),
      artPriority: cleanName(data.artPriority || (existing && existing.artPriority) || ''),
      referenceUrl: String(data.referenceUrl || (existing && existing.referenceUrl) || ''),
      developerName: cleanName(data.developerName || (existing && existing.developerName) || ''),
      designAssignedAt: String(data.designAssignedAt || (existing && existing.designAssignedAt) || ''),
      developmentAssignedAt: String(data.developmentAssignedAt || (existing && existing.developmentAssignedAt) || ''),
      isToy: opts.isToy !== undefined ? Boolean(opts.isToy) : (Boolean(existing && existing.isToy) || isToyDimensionProduct(data)),
      packageCode: String(data.packageCode || (existing && existing.packageCode) || ''),
      printCode: String(data.printCode || (existing && existing.printCode) || ''),
      purchasePrice: normalizeLedgerPurchasePrice(opts.purchasePrice !== undefined ? opts.purchasePrice : (data.purchasePrice || (existing && existing.purchasePrice) || '')),
      boxFileState: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)),
      labelFileState: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)),
      imagePackState: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)),
      artworkState: normalizeLedgerArtworkState(opts.artworkState !== undefined ? opts.artworkState : (existing && existing.artworkState)),
      aiImageStatus: normalizeLedgerAiImageStatus(
        opts.aiImageStatus !== undefined ? opts.aiImageStatus : (existing && existing.aiImageStatus),
        opts.aiImageMessage !== undefined ? opts.aiImageMessage : (existing && existing.aiImageMessage)
      ),
      aiImageMessage: String(opts.aiImageMessage !== undefined ? opts.aiImageMessage || '' : (existing && existing.aiImageMessage) || '').slice(0, 180),
      aiImageJobId: String(opts.aiImageJobId !== undefined ? opts.aiImageJobId || '' : (existing && existing.aiImageJobId) || '').slice(0, 120),
      aiImageCheckedAtMs: Number(opts.aiImageCheckedAtMs !== undefined ? opts.aiImageCheckedAtMs || 0 : (existing && existing.aiImageCheckedAtMs) || 0) || 0,
      aiMainImages: normalizeLedgerAiImageItems(opts.aiMainImages !== undefined ? opts.aiMainImages : (existing && existing.aiMainImages), 12),
      aiDetailImages: normalizeLedgerAiImageItems(opts.aiDetailImages !== undefined ? opts.aiDetailImages : (existing && existing.aiDetailImages), 20),
      aiMainRetouchedImages: normalizeLedgerAiImageItems(opts.aiMainRetouchedImages !== undefined ? opts.aiMainRetouchedImages : (existing && existing.aiMainRetouchedImages), LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiDetailRetouchedImages: normalizeLedgerAiImageItems(opts.aiDetailRetouchedImages !== undefined ? opts.aiDetailRetouchedImages : (existing && existing.aiDetailRetouchedImages), LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiMainRetouchTasks: normalizeLedgerAiImageRetouchTasks(opts.aiMainRetouchTasks !== undefined ? opts.aiMainRetouchTasks : (existing && existing.aiMainRetouchTasks), LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiDetailRetouchTasks: normalizeLedgerAiImageRetouchTasks(opts.aiDetailRetouchTasks !== undefined ? opts.aiDetailRetouchTasks : (existing && existing.aiDetailRetouchTasks), LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiMainHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(opts.aiMainHiddenImageKeys !== undefined ? opts.aiMainHiddenImageKeys : (existing && existing.aiMainHiddenImageKeys), LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetailHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(opts.aiDetailHiddenImageKeys !== undefined ? opts.aiDetailHiddenImageKeys : (existing && existing.aiDetailHiddenImageKeys), LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetail3Audit: normalizeLedgerDetail3Audit(opts.aiDetail3Audit !== undefined ? opts.aiDetail3Audit : (existing && existing.aiDetail3Audit)),
      boxFileDone: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)) === 'done',
      labelFileDone: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)) === 'done',
      imagePackDone: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)) === 'done',
      filesAutoCompleted: opts.filesAutoCompleted !== undefined ? Boolean(opts.filesAutoCompleted) : Boolean(existing && existing.filesAutoCompleted),
      performanceType: opts.performanceType !== undefined ? (opts.performanceType === 'extension' ? 'extension' : '') : ((existing && existing.performanceType) || ''),
      performanceGroupMode: opts.performanceGroupMode !== undefined
        ? (opts.performanceGroupMode === 'series' ? 'series' : '')
        : ((existing && existing.performanceGroupMode) || ''),
      seriesExcluded: opts.seriesExcluded !== undefined ? Boolean(opts.seriesExcluded) : (Boolean(existing && existing.seriesExcluded) || Boolean(state.ledgerSeriesExcludedSkus && state.ledgerSeriesExcludedSkus.has(sku))),
      status: preserveFinalizedState ? normalizeLedgerStatus(existing.status || '已定稿') : normalizeLedgerStatus(opts.status || (existing && existing.status) || '待定稿'),
      stage: preserveFinalizedState ? (existing.stage || '已定稿') : (opts.stage || (existing && existing.stage) || '待定稿'),
      note: opts.note !== undefined ? String(opts.note || '') : ((existing && existing.note) || ''),
      imageGeneratedAt: opts.imageGeneratedAt !== undefined ? String(opts.imageGeneratedAt || '') : ((existing && existing.imageGeneratedAt) || ''),
      imageGeneratedAtMs: opts.imageGeneratedAtMs !== undefined ? (Number(opts.imageGeneratedAtMs || 0) || 0) : (Number(existing && existing.imageGeneratedAtMs) || 0),
      finalizedAt: opts.finalizedAt !== undefined ? String(opts.finalizedAt || '') : ((existing && existing.finalizedAt) || ''),
      finalizedDate: opts.finalizedDate !== undefined ? normalizeLedgerDate(opts.finalizedDate) : ((existing && existing.finalizedDate) || ''),
      finalizedAtMs: opts.finalizedAtMs !== undefined ? (Number(opts.finalizedAtMs || 0) || 0) : (Number(existing && existing.finalizedAtMs) || 0),
      createdAt: (existing && existing.createdAt) || nowText,
      createdAtMs: (existing && existing.createdAtMs) || nowMs,
      updatedAt: nowText,
      updatedAtMs: nowMs,
    };
    const reconciled = reconcileLedgerFileCompletion(next);
    if (opts.skipUnchanged && existing && !hasMeaningfulLedgerRecordChange(existing, reconciled)) return existing;
    state.ledgerRecords = [reconciled].concat((state.ledgerRecords || []).filter((item) => !(getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku) && getMonthKeyFromDateKey(item.date) === dateMonth))).slice(0, 1200);
    if (!opts.deferSave) saveDailyLedger();
    return reconciled;
  }

  function hasCompletedLegacyManualSkuLedgerMigration() {
    try {
      if (typeof GM_getValue === 'function') return Boolean(GM_getValue(DAILY_LEDGER_MANUAL_MIGRATION_KEY, false));
      return localStorage.getItem(DAILY_LEDGER_MANUAL_MIGRATION_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function markLegacyManualSkuLedgerMigrationComplete() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_MANUAL_MIGRATION_KEY, true);
      else localStorage.setItem(DAILY_LEDGER_MANUAL_MIGRATION_KEY, '1');
    } catch (error) {
      console.warn('PLM floating helper manual ledger migration flag save failed:', error);
    }
  }

  function scheduleLegacyManualSkuLedgerMigration(delayMs) {
    if (hasCompletedLegacyManualSkuLedgerMigration()) return;
    window.setTimeout(() => {
      try {
        migrateLegacyManualSkuLedger();
      } catch (error) {
        console.warn('PLM floating helper manual ledger migration failed:', error);
        addLog('warn', '历史手动 SKU 补录失败', formatErrorMessage(error));
      }
    }, Math.max(0, Number(delayMs) || 0));
  }

  function migrateLegacyManualSkuLedger() {
    const candidates = (Array.isArray(state.index) ? state.index.slice() : []).map((indexItem) => {
      const sku = String(indexItem && indexItem.sku || '').trim().toUpperCase();
      if (!sku) return null;
      const cached = loadData(sku);
      const data = normalizeData({ ...(indexItem || {}), ...(cached || {}), sku });
      const isManual = data.skuListSource === 'manual-code' || Boolean(data.manualSkuAddedAt);
      if (!isManual) return null;
      const addedAtMs = Number(data.manualSkuAddedAtMs || 0) || 0;
      const addedAt = String(data.manualSkuAddedAt || data.designAssignedAt || '').trim()
        || (addedAtMs ? new Date(addedAtMs).toLocaleString() : new Date().toLocaleString());
      const next = data.designAssignedAt ? data : normalizeData({ ...data, designAssignedAt: addedAt });
      return {
        data: next,
        date: addedAtMs ? formatLocalDate(new Date(addedAtMs)) : (parseLedgerDateFromText(addedAt) || getTodayKey()),
      };
    }).filter(Boolean);
    if (!candidates.length) {
      markLegacyManualSkuLedgerMigrationComplete();
      return;
    }
    syncDailyLedgerBeforeMutation();
    const existingSkus = new Set((state.ledgerRecords || []).map((item) => getLedgerSkuKey(item && item.sku)).filter(Boolean));
    let changedCount = 0;
    candidates.forEach((candidate) => {
      const skuKey = getLedgerSkuKey(candidate.data.sku);
      if (!skuKey || existingSkus.has(skuKey)) return;
      const record = upsertDailyLedgerFromData(candidate.data, {
        date: candidate.date,
        status: '待定稿',
        stage: '待定稿',
        note: '历史手动添加自动补录',
        deferSave: true,
        skipStorageSync: true,
        skipUnchanged: true,
      });
      if (record) {
        existingSkus.add(skuKey);
        changedCount += 1;
      }
    });
    if (changedCount) {
      saveDailyLedger();
      addLog('info', '历史手动 SKU 已补录今日工作台', changedCount + ' 个');
      if (state.view === 'ledger' && !renderLedgerTabContent(ensurePanel())) renderShell();
    }
    markLegacyManualSkuLedgerMigrationComplete();
  }

  function updateDailyLedgerForSku(sku, patch, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const data = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    return upsertDailyLedgerFromData(data, { ...(patch || {}), date: key });
  }

  function normalizeLedgerRegistrationDesignType(value) {
    const text = cleanName(value || '').trim();
    const compact = text.replace(/\s+/g, '');
    if (/^设计近似(?:50|80)%$/.test(compact)) return '设计';
    if (/^(?:无|换)logo$/i.test(compact)) return '换LOGO';
    return text;
  }

  function getLedgerRegistrationRows(rows) {
    const source = Array.isArray(rows) ? rows : [];
    const groups = summarizeLedgerPerformance(source).groups || [];
    const recordGroupIds = new Map();
    groups.forEach((group) => {
      (group.recordKeys || []).forEach((key) => recordGroupIds.set(key, group.id));
    });
    const exportedGroupIds = new Set();
    return source.filter((record) => {
      const groupId = recordGroupIds.get(getLedgerSelectionKey(record));
      if (!groupId) return true;
      if (exportedGroupIds.has(groupId)) return false;
      exportedGroupIds.add(groupId);
      return true;
    });
  }

  function copyLedgerTsv(dateKey) {
    const rows = getLedgerRecordsForMonth('finalized', normalizeLedgerMonth(dateKey || state.ledgerDate)).filter((item) => item.finalizedAt && item.status !== '作废');
    if (!rows.length) {
      showToast('本月没有可复制的已定稿记录');
      return;
    }
    const person = findCurrentPlmUserName();
    if (!person) {
      showToast('未识别到当前 PLM 用户姓名，请刷新页面后重试');
      return;
    }
    const exportedRows = getLedgerRegistrationRows(rows);
    const tsv = exportedRows.map((item) => {
      const cached = normalizeData(loadData(item.sku) || {});
      const productName = [item.brand || cached.brand, item.name || cached.name].filter(Boolean).join(' ');
      const date = item.finalizedAt || '';
      const designType = normalizeLedgerRegistrationDesignType(item.designType || cached.designType || '');
      return [productName, item.sku || '', '', date, designType, person].map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ').trim()).join('\t');
    }).join('\n');
    copyText(tsv);
    const omittedCount = rows.length - exportedRows.length;
    showToast('本月登记已复制：' + exportedRows.length + '条' + (omittedCount ? ' · 系列省略' + omittedCount + '条' : '') + ' · 6列');
  }

  function copySelectedFinalizedLedgerSkus() {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const rows = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((item) => selected.has(getLedgerSelectionKey(item)));
    if (!rows.length) {
      showToast('请先勾选需要复制的产品');
      return;
    }
    const skus = Array.from(new Set(rows.map((item) => item.sku).filter(Boolean)));
    copyText(skus.join('\n'));
    showToast('已复制选中编码：' + skus.length + '个');
  }

  function getLedgerSelectionKey(record) {
    return normalizeLedgerDate(record && record.date || '') + '::' + String(record && record.sku || '');
  }

  function setLedgerVisibleSelection(selectAll) {
    if (state.ledgerView === 'trash') return;
    const records = getVisibleLedgerWorkbenchRecords();
    if (selectAll && !records.length) {
      showToast('当前筛选没有可选择的记录');
      return;
    }
    state.ledgerSelectedKeys = selectAll ? Array.from(new Set(records.map(getLedgerSelectionKey))) : [];
    if (!renderLedgerTabContent(ensurePanel())) renderShell();
    showToast(selectAll ? '已全选当前筛选的 ' + records.length + ' 条记录' : '已取消全选');
  }

  function toggleLedgerSelection(sku, dateKey) {
    const normalizedDate = normalizeLedgerDate(dateKey);
    const record = (state.ledgerRecords || []).find((item) => item.sku === sku && normalizeLedgerDate(item.date) === normalizedDate);
    if (!record) return;
    const key = getLedgerSelectionKey(record);
    const selected = new Set(state.ledgerSelectedKeys || []);
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    state.ledgerSelectedKeys = Array.from(selected);
    refreshLedgerCard(record);
    refreshLedgerPerformanceMergeButton();
  }

  function toggleLedgerDateSelection(dateKey) {
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth()).filter((item) => getLedgerFinalizedDate(item) === normalizeLedgerDate(dateKey));
    const selected = new Set(state.ledgerSelectedKeys || []);
    const keys = records.map(getLedgerSelectionKey);
    const remove = keys.length && keys.every((key) => selected.has(key));
    keys.forEach((key) => remove ? selected.delete(key) : selected.add(key));
    state.ledgerSelectedKeys = Array.from(selected);
    renderShell();
  }

  function updateSelectedLedgerPerformanceGroups(merge) {
    const selectedKeys = new Set(state.ledgerSelectedKeys || []);
    const selectedRecords = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((record) => selectedKeys.has(getLedgerSelectionKey(record)));
    if (merge && selectedRecords.length < 2) {
      showToast('请至少选择两个编码再合并绩效');
      return;
    }
    if (!merge && !selectedRecords.some((record) => record.performanceGroupId)) {
      showToast('选中的编码尚未合并绩效');
      return;
    }
    const targetKeys = new Set(selectedRecords.map(getLedgerSelectionKey));
    const groupId = merge ? 'performance-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) : '';
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    state.ledgerRecords = (state.ledgerRecords || []).map((record) => targetKeys.has(getLedgerSelectionKey(record))
      ? { ...record, performanceGroupId: groupId, performanceGroupMode: '', updatedAt: nowText, updatedAtMs: nowMs }
      : record);
    state.ledgerSelectedKeys = [];
    saveDailyLedger();
    renderShell();
    showToast(merge ? '已合并为 1 个绩效单位' : '已取消绩效合并');
  }

  function openLedgerPerformanceGroupModal() {
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    const selected = new Set(state.ledgerSelectedKeys || []);
    const selectedSkus = records
      .filter((record) => selected.has(getLedgerSelectionKey(record)))
      .map((record) => getLedgerSkuKey(record.sku))
      .filter(Boolean);
    state.ledgerPerformanceGroupOpen = true;
    state.ledgerPerformanceGroupInput = selectedSkus.join('\n');
    state.ledgerPerformanceGroupStatus = '';
    renderShell();
    window.setTimeout(() => {
      const panel = document.getElementById(PANEL_ID);
      const input = panel && panel.querySelector('.pfh-ledger-performance-group-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  function closeLedgerPerformanceGroupModal() {
    state.ledgerPerformanceGroupOpen = false;
    state.ledgerPerformanceGroupInput = '';
    state.ledgerPerformanceGroupStatus = '';
    const panel = document.getElementById(PANEL_ID);
    const modal = panel && panel.querySelector('.pfh-ledger-performance-group-modal');
    if (modal) modal.remove();
  }

  function applyLedgerPerformanceGroupFromInput() {
    const summary = getLedgerPerformanceGroupInputSummary(state.ledgerPerformanceGroupInput);
    if (summary.matched.length < 2) {
      state.ledgerPerformanceGroupStatus = summary.matched.length
        ? '当前月份已定稿记录只找到 1 个编码，至少需要 2 个才能编组。'
        : '当前月份已定稿记录中没有找到可编组编码。';
      const panel = document.getElementById(PANEL_ID);
      refreshLedgerPerformanceGroupPreview(panel && panel.querySelector('.pfh-ledger-performance-group-modal'));
      const status = panel && panel.querySelector('[data-ledger-performance-group-status]');
      if (status) status.textContent = state.ledgerPerformanceGroupStatus;
      showToast(state.ledgerPerformanceGroupStatus);
      return;
    }
    const targetKeys = new Set(summary.matched.map(getLedgerSelectionKey));
    const groupId = 'performance-manual-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    let changedCount = 0;
    state.ledgerRecords = (state.ledgerRecords || []).map((record) => {
      if (!targetKeys.has(getLedgerSelectionKey(record))) return record;
      changedCount += 1;
      return { ...record, performanceGroupId: groupId, performanceGroupMode: 'series', updatedAt: nowText, updatedAtMs: nowMs };
    });
    state.ledgerSelectedKeys = [];
    saveDailyLedger();
    closeLedgerPerformanceGroupModal();
    renderShell();
    const missingText = summary.missing.length ? '；未找到 ' + summary.missing.length + ' 个，未处理' : '';
    const truncatedText = summary.truncated ? '（最多处理 ' + LEDGER_PERFORMANCE_GROUP_MAX_ITEMS + ' 个）' : '';
    showToast('已按编码编组 ' + changedCount + ' 个产品' + missingText + truncatedText);
  }

  function copySelectedLedgerVideoRows() {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const rows = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth()).filter((item) => selected.has(getLedgerSelectionKey(item)));
    if (!rows.length) {
      showToast('请先选择产品卡片或日期');
      return;
    }
    const person = findCurrentPlmUserName() || state.sizeImageAccessName || String(state.settings.cloudBackupOwnerName || '').trim();
    if (!person) {
      showToast('未识别到当前 PLM 用户姓名，请刷新页面后重试');
      return;
    }
    const text = rows.map((item) => {
      const cached = normalizeData(loadData(item.sku) || {});
      return [person, item.referenceUrl || cached.referenceUrl || '', item.name || cached.name || item.sku]
        .map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ').trim()).join('\t');
    }).join('\n');
    copyText(text);
    showToast('视频申请内容已复制：' + rows.length + '个产品');
  }

  function exportLedgerRecords(dateKey) {
    const month = normalizeLedgerMonth(dateKey || state.ledgerDate);
    const records = getLedgerRecordsForMonth('design', month);
    const payload = { plugin: L.title, version: SCRIPT_VERSION, exportedAt: new Date().toLocaleString(), month, records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-daily-ledger-' + payload.month + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    showToast('本月记录已导出');
  }

  function clearLedgerDate(dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    if (!window.confirm('确定清空 ' + formatLedgerDateLabel(key) + ' 的今日工作台记录吗？')) return;
    state.ledgerRecords = (state.ledgerRecords || []).filter((item) => item.date !== key);
    saveDailyLedger();
    renderShell();
  }

  function updateLedgerFromAction(action, sku, dateKey, options) {
    if (!sku) return;
    syncDailyLedgerBeforeMutation();
    state.ledgerMenuSku = '';
    state.ledgerMenuDate = '';
    if (action === 'ledger-image-generated') {
      state.ledgerFlowTransitionSku = sku;
      window.clearTimeout(state.ledgerFlowTransitionTimer);
      state.ledgerFlowTransitionTimer = window.setTimeout(() => {
        if (state.ledgerFlowTransitionSku !== sku) return;
        state.ledgerFlowTransitionSku = '';
        const current = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === normalizeLedgerDate(dateKey));
        if (current) refreshLedgerCard(current);
      }, 680);
    }
    if (action === 'ledger-remove') {
      const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
      const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
      if (!record) return;
      const nowText = new Date().toLocaleString();
      const nowMs = Date.now();
      const month = getMonthKeyFromDateKey(key);
      state.ledgerTrashRecords = [{ ...record, removedAt: nowText, removedAtMs: nowMs }]
        .concat((state.ledgerTrashRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month)))
        .slice(0, 1200);
      state.ledgerRecords = (state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month));
      state.ledgerSelectedKeys = (state.ledgerSelectedKeys || []).filter((item) => item !== getLedgerSelectionKey(record));
      saveDailyLedger();
      saveDailyLedgerTrash();
      renderShell();
      showToast('已移入垃圾篓，不会再次自动加入');
      return;
    }
    const today = getNowLedgerMinuteLabel();
    const todayKey = getTodayKey();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const nextSeriesExcluded = action === 'ledger-series-exclude' ? !isLedgerSeriesExcluded(existing || { sku }) : false;
    if (action === 'ledger-series-exclude') {
      const excluded = new Set(state.ledgerSeriesExcludedSkus || []);
      if (nextSeriesExcluded) excluded.add(String(sku).trim().toUpperCase());
      else excluded.delete(String(sku).trim().toUpperCase());
      state.ledgerSeriesExcludedSkus = excluded;
      saveLedgerSeriesExcludedSkus();
    }
    const patch = action === 'ledger-image-generated'
      ? { status: '待定稿', stage: '待定稿', imageGeneratedAt: today, imageGeneratedAtMs: Date.now(), note: '已出图，等待定稿' }
      : action === 'ledger-unmark-image-generated'
        ? { status: '待出图', stage: '待出图', imageGeneratedAt: '', imageGeneratedAtMs: 0, note: '已撤回出图' }
        : action === 'ledger-unfinalize'
          ? { status: '待定稿', stage: '待定稿', finalizedAt: '', finalizedDate: '', finalizedAtMs: 0, note: '已撤回定稿' }
        : action === 'ledger-extension'
          ? {
            performanceType: existing && existing.performanceType === 'extension' ? '' : 'extension',
            note: existing && existing.performanceType === 'extension' ? '已取消延伸绩效' : '延伸绩效按 0.3 计算',
          }
        : action === 'ledger-series-exclude'
          ? { seriesExcluded: nextSeriesExcluded, note: nextSeriesExcluded ? '已手动剔除自动系列' : '已恢复自动系列' }
          : action === 'ledger-finalize'
            ? { status: '已定稿', stage: '已定稿', finalizedAt: today, finalizedDate: todayKey, finalizedAtMs: Date.now(), note: '手动定稿' }
            : action === 'ledger-void'
              ? {
                status: '作废',
                stage: '作废',
                finalizedAt: existing && existing.finalizedAt || today,
                finalizedDate: existing && existing.finalizedDate || todayKey,
                finalizedAtMs: Number(existing && existing.finalizedAtMs) || Date.now(),
                note: '手动作废',
              }
              : { status: '已完成', stage: '完成', note: '手动完成', filesAutoCompleted: false };
    const opts = options || {};
    const finalPatch = opts.purchasePrice ? { ...patch, purchasePrice: opts.purchasePrice } : patch;
    const updatedRecord = updateDailyLedgerForSku(sku, { ...finalPatch, skipStorageSync: true }, key);
    if (action === 'ledger-finalize' && opts.purchasePrice) {
      const currentData = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      const changed = String(currentData.purchasePrice || '') !== opts.purchasePrice;
      const pricedData = normalizeData({ ...currentData, purchasePrice: opts.purchasePrice });
      saveData(sku, pricedData);
      if (state.data && state.data.sku === sku) state.data = pricedData;
      if (changed) recordCommerceInsight(pricedData, null, { price: opts.purchasePrice, source: 'ledger-finalize' });
    }
    refreshLedgerCard(updatedRecord);
    refreshLedgerPerformanceSummary();
    if (action === 'ledger-extension') showToast(updatedRecord && updatedRecord.performanceType === 'extension' ? '已设为延伸，绩效按 0.3 分计算' : '已取消延伸绩效');
    if (action === 'ledger-series-exclude') showToast(nextSeriesExcluded ? '已剔除自动系列，按单独产品计算' : '已恢复自动系列匹配');
    if (action === 'ledger-finalize') scheduleDesktopBridgeSnapshot();
  }

  function updateLedgerTrashFromAction(action, sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    const month = getMonthKeyFromDateKey(key);
    const record = (state.ledgerTrashRecords || []).find((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month);
    if (!record) return;
    if (action === 'ledger-trash-delete' && !window.confirm('确定从垃圾篓清除 ' + sku + ' 吗？清除后仍会保留防回抓标记。')) return;
    if (action === 'ledger-trash-restore') {
      state.ledgerTrashRecords = (state.ledgerTrashRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month));
      const restored = sanitizeLedgerRecords([{ ...record, updatedAt: new Date().toLocaleString(), updatedAtMs: Date.now() }])[0];
      state.ledgerRecords = [restored].concat((state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month))).slice(0, 1200);
      saveDailyLedger();
    } else {
      state.ledgerTrashRecords = (state.ledgerTrashRecords || []).map((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month ? { ...item, purged: true } : item);
    }
    saveDailyLedgerTrash();
    renderShell();
    showToast(action === 'ledger-trash-restore' ? '已恢复到今日工作台' : '已从垃圾篓清除，仍会阻止自动加入');
  }

  function emptyLedgerTrashMonth(dateKey) {
    const month = normalizeLedgerMonth(dateKey || getTodayKey());
    const count = (state.ledgerTrashRecords || []).filter((item) => !item.purged && getMonthKeyFromDateKey(item.date) === month).length;
    if (!count || !window.confirm('确定清空 ' + formatLedgerMonthLabel(month) + ' 的 ' + count + ' 条垃圾篓记录吗？清空后仍会保留防回抓标记。')) return;
    state.ledgerTrashRecords = (state.ledgerTrashRecords || []).map((item) => getMonthKeyFromDateKey(item.date) === month ? { ...item, purged: true } : item);
    saveDailyLedgerTrash();
    renderShell();
    showToast('本月垃圾篓已清空，移除编码仍不会自动加入');
  }
