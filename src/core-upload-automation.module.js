
  async function processQueuedUploadFiles(files) {
    const supported = Array.from(files || []).filter((file) => file && getUploadKindFromFileName(file.name));
    if (!supported.length) {
      showToast('\u8bf7\u62d6\u5165\u6216\u7c98\u8d34 xls\u3001xlsx\u3001zip \u6216 rar \u6587\u4ef6');
      return;
    }
    for (const file of supported) await storeQueuedUploadFile(file);
  }

  function isCopyrightImageFile(file) {
    return Boolean(file && (/^image\/(?:jpeg|png)$/i.test(file.type || '') || /\.(?:png|jpe?g)$/i.test(file.name || '')));
  }

  function normalizeCopyrightImageFile(file, index) {
    if (/\.(?:png|jpe?g)$/i.test(file && file.name || '')) return file;
    const extension = file && file.type === 'image/jpeg' ? 'jpg' : 'png';
    return new File([file], '\u7248\u6743\u56fe-' + (Number(index) + 1) + '.' + extension, { type: file.type || 'image/png', lastModified: file.lastModified || Date.now() });
  }

  function stageCopyrightUploadFiles(files) {
    const candidates = Array.from(files || []).filter(isCopyrightImageFile).map(normalizeCopyrightImageFile);
    const supported = candidates.filter((file) => file.size <= 50 * 1024 * 1024);
    if (!supported.length) {
      showToast(candidates.length ? '\u7248\u6743\u56fe\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 50MB' : '\u8bf7\u7c98\u8d34\u6216\u62d6\u5165 JPG / PNG \u56fe\u7247');
      return;
    }
    const current = Array.isArray(state.copyrightPendingFiles) ? state.copyrightPendingFiles : [];
    const seen = new Set(current.map((file) => [file.name, file.size, file.lastModified].join('|')));
    const additions = supported.filter((file) => {
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    state.copyrightPendingFiles = current.concat(additions).slice(0, 60);
    renderShell();
    showToast('\u5df2\u9009\u62e9 ' + state.copyrightPendingFiles.length + ' \u5f20\u7248\u6743\u56fe');
  }

  function assignCopyrightFilesToSkus(skus, files) {
    const assignments = new Map(skus.map((sku) => [sku, []]));
    const named = files.map((file) => ({ file, matches: skus.filter((sku) => String(file.name || '').toUpperCase().includes(sku)) }));
    if (named.every((item) => item.matches.length === 1)) {
      named.forEach((item) => assignments.get(item.matches[0]).push(item.file));
      if (skus.every((sku) => assignments.get(sku).length)) return assignments;
      assignments.forEach((value, key) => assignments.set(key, []));
    }
    if (skus.length === 1) {
      assignments.set(skus[0], files.slice());
      return assignments;
    }
    if (files.length === 1) {
      skus.forEach((sku) => assignments.set(sku, files.slice()));
      return assignments;
    }
    if (files.length === skus.length) {
      skus.forEach((sku, index) => assignments.set(sku, [files[index]]));
      return assignments;
    }
    return null;
  }

  async function addCopyrightQueueItems(input, pendingFiles) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    const files = Array.from(pendingFiles || []).filter(isCopyrightImageFile);
    if (!skus.length || !files.length) {
      showToast('\u8bf7\u5148\u8f93\u5165 SKU \u5e76\u7c98\u8d34\u6216\u9009\u62e9\u7248\u6743\u56fe');
      return;
    }
    const assignments = assignCopyrightFilesToSkus(skus, files);
    if (!assignments) {
      showToast('\u591a SKU \u65f6\uff0c\u8bf7\u8ba9\u56fe\u7247\u6570\u91cf\u4e0e SKU \u6570\u91cf\u4e00\u81f4\uff0c\u6216\u5728\u6587\u4ef6\u540d\u4e2d\u5e26\u4e0a SKU');
      return;
    }
    try {
      const queue = loadUploadQueue();
      const now = new Date().toLocaleString();
      for (const sku of skus) {
        let item = queue.find((entry) => entry.kind === 'copyright' && entry.sku === sku && !/\u6210\u529f/.test(entry.status || ''));
        if (!item) {
          const cached = loadData(sku);
          item = {
            id: 'copyright-' + sku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            kind: 'copyright',
            sku,
            name: buildUploadDisplayName(cached, '', sku),
            copyrightFiles: [],
            createdAt: now,
            updatedAt: now,
          };
          queue.unshift(item);
        }
        const existingNames = new Set(getCopyrightUploadEntries(item).map((entry) => entry.name + '|' + entry.size));
        for (const [index, file] of assignments.get(sku).entries()) {
          const identity = file.name + '|' + file.size;
          if (existingNames.has(identity)) continue;
          const key = uploadFileKey(sku, 'copyright') + ':' + Date.now() + ':' + index + ':' + Math.random().toString(36).slice(2, 7);
          await putUploadFile(key, cloneUploadFile(file));
          item.copyrightFiles.push({ key, name: file.name, size: file.size, type: file.type || guessMime(file.name) });
          existingNames.add(identity);
        }
        item.status = getCopyrightUploadEntries(item).length ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = getCopyrightUploadEntries(item).length ? '\u7248\u6743\u56fe\u5df2\u5c31\u7eea' : '\u7f3a\u7248\u6743\u56fe';
        item.skipReason = '';
        item.forceReplace = false;
        item.updatedAt = now;
      }
      state.uploadQueue = queue;
      state.copyrightSkuInput = '';
      state.copyrightPendingFiles = [];
      state.uploadPage = 1;
      saveUploadQueue();
      renderShell();
      showToast(skus.length + ' \u4e2a\u7248\u6743\u56fe\u4efb\u52a1\u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper copyright queue failed:', error);
      showToast('\u7248\u6743\u56fe\u4efb\u52a1\u4fdd\u5b58\u5931\u8d25');
    }
  }

  function startTailSealEdit(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    if (!row) return;
    const valueBox = row.querySelector('.pfh-value');
    if (!valueBox) return;
    row.classList.add('is-inline-editing');
    const current = firstNumber(state.data && state.data.productLength);
    valueBox.innerHTML = '<span class="pfh-inline-edit"><input class="pfh-tail-input" type="text" placeholder="cm" value="' +
      escapeHtml(Number.isFinite(current) ? trimNumber(current) : '') +
      '"><button type="button" data-action="confirm-tail-seal">' + escapeHtml(L.ok) + '</button></span>';
    const input = valueBox.querySelector('input');
    if (input) input.focus();
  }

  function confirmTailSealLength(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    const input = row && row.querySelector('.pfh-tail-input');
    const cm = firstNumber(input && input.value);
    if (!Number.isFinite(cm) || cm <= 0) {
      showToast(L.invalidCm);
      return;
    }
    const value = formatDimensionPart([cm], 0);
    state.data = normalizeData({ ...(state.data || {}), tailSealLengthValue: value, productLength: value });
    if (state.data.sku) saveData(state.data.sku, state.data);
    renderShell();
  }

  async function storeQueuedUploadFile(file) {
    if (!file) return;
    const kind = getUploadKindFromFileName(file.name);
    if (!kind) return;
    const skus = getSkusFromFileName(file.name);
    if (!skus.length) {
      showToast(L.uploadNoSkuInFile + ': ' + file.name);
      return;
    }
    if (kind === 'zip' && file.size > UPLOAD_MAX_ZIP_BYTES) {
      const skippedItems = [];
      for (const sku of skus) {
        const item = ensureUploadQueueItem(sku, file.name);
        if (item.zipKey) deleteUploadFile(item.zipKey).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
        item.zipName = file.name;
        item.zipKey = '';
        item.status = '\u5df2\u8df3\u8fc7';
        item.step = L.uploadFileTooLarge;
        item.skipReason = L.uploadFileTooLarge;
        item.updatedAt = new Date().toLocaleString();
        skippedItems.push(item);
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + L.uploadFileTooLarge);
      return;
    }
    try {
      for (const sku of skus) {
        const key = uploadFileKey(sku, kind);
        await putUploadFile(key, cloneUploadFile(file));
        const item = ensureUploadQueueItem(sku, file.name);
        if (kind === 'xlsx') {
          item.xlsxName = file.name;
          item.xlsxKey = key;
        } else {
          item.zipName = file.name;
          item.zipKey = key;
        }
        item.status = item.xlsxKey && item.zipKey ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = item.xlsxKey && item.zipKey ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item);
        item.forceReplace = false;
        item.skipReason = '';
        item.updatedAt = new Date().toLocaleString();
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + kind.toUpperCase() + ' \u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper store upload file failed:', error);
      showToast('\u6587\u4ef6\u8bb0\u5f55\u5931\u8d25');
    }
  }

  function ensureUploadQueueItem(sku, filename) {
    let item = state.uploadQueue.find((entry) => (entry.kind || 'standard') === 'standard' && entry.sku === sku && !/成功/.test(entry.status || ''));
    if (item) return item;
    const cached = loadData(sku);
    item = {
      id: sku + '-' + Date.now(),
      sku,
      name: buildUploadDisplayName(cached, filename, sku),
      status: '\u7f3a\u6587\u4ef6',
      step: '',
      forceReplace: false,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    state.uploadQueue.unshift(item);
    return item;
  }

  function addToyLabelQueueItems(input) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    if (!skus.length) {
      showToast('请粘贴至少一个 SKU 编码');
      return;
    }
    const queued = new Set((state.uploadQueue || []).filter((item) => item.kind === 'toy-label' && !/\u6210\u529f/.test(item.status || '')).map((item) => item.sku));
    const now = new Date().toLocaleString();
    const items = skus.filter((sku) => !queued.has(sku)).map((sku, index) => {
      const cached = loadData(sku);
      return {
        id: 'toy-label-' + sku + '-' + Date.now() + '-' + index,
        kind: 'toy-label',
        sku,
        name: buildUploadDisplayName(cached, '', sku),
        xlsxKey: 'toy-label',
        zipKey: 'toy-label',
        status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
        step: cached ? '\u7b49\u5f85\u6279\u91cf\u641c\u7d22' : '\u7b49\u5f85\u4ece\u8bbe\u8ba1\u4efb\u52a1\u83b7\u53d6\u6570\u636e',
        createdAt: now,
        updatedAt: now,
      };
    });
    if (!items.length) {
      showToast('这些 SKU 已在玩具标签任务栏中');
      return;
    }
    state.uploadQueue = items.concat(state.uploadQueue || []);
    state.toyLabelSkuInput = '';
    state.uploadPage = 1;
    saveUploadQueue();
    renderShell();
    showToast(items.length + ' 个玩具标签任务已加入');
  }

  function addUploadTaskFromSku(sku, mode) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const uploadMode = normalizeUploadMode(mode);
    if (!normalizedSku || !isUploadSkuPickerMode(uploadMode)) return;
    const queue = loadUploadQueue();
    const existing = queue.find((item) => getUploadItemMode(item) === uploadMode && item.sku === normalizedSku && !/\u6210\u529f/.test(item.status || ''));
    if (existing) {
      state.uploadMode = uploadMode;
      state.uploadView = 'queue';
      renderShell();
      showToast(normalizedSku + ' 已在当前任务栏中');
      return;
    }
    const cached = loadData(normalizedSku);
    const now = new Date().toLocaleString();
    const item = uploadMode === 'toy-label'
      ? {
        id: 'toy-label-' + normalizedSku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'toy-label',
        sku: normalizedSku,
        name: buildUploadDisplayName(cached, '', normalizedSku),
        xlsxKey: 'toy-label',
        zipKey: 'toy-label',
        status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
        step: cached ? '\u7b49\u5f85\u6279\u91cf\u641c\u7d22' : '\u7b49\u5f85\u4ece\u8bbe\u8ba1\u4efb\u52a1\u83b7\u53d6\u6570\u636e',
        createdAt: now,
        updatedAt: now,
      }
      : {
        id: 'copyright-' + normalizedSku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'copyright',
        sku: normalizedSku,
        name: buildUploadDisplayName(cached, '', normalizedSku),
        copyrightFiles: [],
        status: '\u7f3a\u6587\u4ef6',
        step: '\u7f3a\u7248\u6743\u56fe',
        createdAt: now,
        updatedAt: now,
      };
    queue.unshift(item);
    state.uploadQueue = queue;
    state.uploadMode = uploadMode;
    state.uploadView = 'queue';
    state.uploadPage = 1;
    saveUploadQueue();
    renderShell();
    showToast(normalizedSku + ' 已加入' + (uploadMode === 'copyright' ? '版权图' : '玩具标签') + '任务');
  }

  function cloneUploadFile(file) {
    return new File([file], file.name, { type: file.type || guessMime(file.name), lastModified: file.lastModified || Date.now() });
  }

  function getSkusFromFileName(filename) {
    const matches = String(filename || '').match(/\bSKU\d+\b/ig) || [];
    return matches.map((sku) => sku.toUpperCase()).filter((sku, index, arr) => arr.indexOf(sku) === index);
  }

  function getMagicUploadSkusFromFileName(filename) {
    const matches = String(filename || '').match(/\bSKU\d{8}\b/ig) || [];
    return matches.map((sku) => sku.toUpperCase()).filter((sku, index, arr) => arr.indexOf(sku) === index);
  }

  function getUploadKindFromFileName(filename) {
    const lower = String(filename || '').toLowerCase();
    if (/\.(xlsx|xls)$/.test(lower)) return 'xlsx';
    if (/\.(zip|rar)$/.test(lower)) return 'zip';
    return '';
  }

  function isToyEffectImageFile(file) {
    return Boolean(file && (/^image\/(?:jpeg|png|bmp)$/i.test(file.type || '') || /\.(?:png|jpe?g|bmp)$/i.test(file.name || '')));
  }

  function normalizeToyEffectMatchText(value) {
    return String(value || '')
      .replace(/\.[^.]+$/, '')
      .replace(/(?:效果图|效果|商品图|SKU图)$/i, '')
      .toLowerCase()
      .replace(/[\s_\-—–·•,，。:：/\\()[\]{}【】（）]/g, '');
  }

  function collectProjectNameRows() {
    const header = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => {
        const names = cells.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
        return names.includes('\u5546\u54c1\u7f16\u7801') && names.includes('\u5546\u54c1\u540d\u79f0');
      }) || [];
    const headerNames = header.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
    const skuIndex = headerNames.indexOf('\u5546\u54c1\u7f16\u7801');
    const nameIndex = headerNames.indexOf('\u5546\u54c1\u540d\u79f0');
    const brandIndex = headerNames.indexOf('\u54c1\u724c');
    if (skuIndex < 0 || nameIndex < 0) return [];
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body) return [];
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const sku = (((compactText(cells[skuIndex] && (cells[skuIndex].innerText || cells[skuIndex].textContent)) || '').match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        brand: brandIndex >= 0 ? compactText(cells[brandIndex] && (cells[brandIndex].innerText || cells[brandIndex].textContent)) : '',
        name: nameIndex >= 0 ? compactText(cells[nameIndex] && (cells[nameIndex].innerText || cells[nameIndex].textContent)) : '',
      };
    }).filter((row) => row.sku && row.name && row.rowId);
  }

  function normalizeToyEffectCandidate(value) {
    if (!value) return null;
    const sku = String(value.sku || '').trim().toUpperCase();
    const name = compactText(value.name || '');
    if (!sku || !name) return null;
    return {
      sku,
      rowId: String(value.rowId || value.projectRowId || value.projectId || '').trim(),
      brand: compactText(value.brand || ''),
      name,
    };
  }

  function mergeToyEffectCandidates(...lists) {
    const bySku = new Map();
    lists.forEach((list) => {
      (Array.isArray(list) ? list : []).forEach((value) => {
        const candidate = normalizeToyEffectCandidate(value);
        if (!candidate) return;
        const previous = bySku.get(candidate.sku) || {};
        bySku.set(candidate.sku, {
          sku: candidate.sku,
          rowId: candidate.rowId || previous.rowId || '',
          brand: candidate.brand || previous.brand || '',
          name: candidate.name || previous.name || '',
        });
      });
    });
    return Array.from(bySku.values());
  }

  function readToyEffectCandidateCache() {
    if (toyEffectCandidateCache) return toyEffectCandidateCache;
    let saved = null;
    try {
      saved = typeof GM_getValue === 'function'
        ? GM_getValue(TOY_EFFECT_CANDIDATE_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(TOY_EFFECT_CANDIDATE_CACHE_KEY) || 'null');
    } catch (_) {
      saved = null;
    }
    const updatedAt = Number(saved && saved.updatedAt) || 0;
    const fresh = updatedAt > 0 && Date.now() - updatedAt <= TOY_EFFECT_CANDIDATE_CACHE_TTL_MS;
    toyEffectCandidateCache = {
      updatedAt,
      candidates: fresh ? mergeToyEffectCandidates(saved && saved.candidates).slice(0, TOY_EFFECT_CANDIDATE_CACHE_MAX) : [],
    };
    return toyEffectCandidateCache;
  }

  function saveToyEffectCandidateCache(candidates) {
    const payload = {
      updatedAt: Date.now(),
      candidates: mergeToyEffectCandidates(candidates).slice(0, TOY_EFFECT_CANDIDATE_CACHE_MAX),
    };
    toyEffectCandidateCache = payload;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(TOY_EFFECT_CANDIDATE_CACHE_KEY, payload);
      else localStorage.setItem(TOY_EFFECT_CANDIDATE_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('PLM floating helper effect candidate cache save failed:', error);
    }
  }

  function getCachedToyEffectCandidates() {
    const saved = readToyEffectCandidateCache();
    const indexed = (state.index || []).map(normalizeToyEffectCandidate).filter(Boolean);
    return mergeToyEffectCandidates(saved.candidates, indexed);
  }

  function canResolveToyEffectFiles(files, candidates) {
    if (!Array.isArray(files) || !files.length || !Array.isArray(candidates) || !candidates.length) return false;
    return files.every((file) => {
      const resolved = resolveToyEffectFile(file, candidates);
      return Boolean(resolved && resolved.candidate && !resolved.ambiguous);
    });
  }

  async function collectToyEffectMatchCandidates(files) {
    const cachedCandidates = getCachedToyEffectCandidates();
    if (canResolveToyEffectFiles(files, cachedCandidates)) {
      magicUploadLog('info', '效果图使用商品候选缓存', cachedCandidates.length + ' 个候选');
      return cachedCandidates;
    }
    let rows = collectProjectNameRows();
    if (!rows.length) {
      const ready = await ensureNewProductProjectPage();
      if (ready && await ensureDesignTaskTab()) {
        await expandProjectResultPageSize(PROJECT_RESULT_MAX_PAGE_SIZE);
        await wait(250);
        rows = collectProjectNameRows();
      }
    } else {
      await expandProjectResultPageSize(PROJECT_RESULT_MAX_PAGE_SIZE);
      await wait(250);
      rows = collectProjectNameRows();
    }
    const indexedCandidates = [];
    (state.index || []).forEach((item) => {
      const data = normalizeData(loadData(item.sku) || item);
      if (data.sku && data.name) indexedCandidates.push({ sku: data.sku, rowId: data.projectRowId || data.projectId || '', brand: data.brand || '', name: data.name });
    });
    const candidates = mergeToyEffectCandidates(cachedCandidates, indexedCandidates, rows).filter((row) => row.sku && row.name);
    if (rows.length) saveToyEffectCandidateCache(candidates);
    return candidates;
  }

  function resolveToyEffectFile(file, candidates) {
    const filename = String(file && file.name || '');
    const normalizedFilename = normalizeToyEffectMatchText(filename);
    const directSkus = getSkusFromFileName(filename);
    const directMatches = directSkus.length ? candidates.filter((candidate) => directSkus.includes(candidate.sku)) : [];
    if (directMatches.length === 1) return { candidate: directMatches[0] };
    const exact = candidates.filter((candidate) => normalizeToyEffectMatchText(candidate.name) === normalizedFilename);
    if (exact.length === 1) return { candidate: exact[0] };
    if (exact.length > 1) return { ambiguous: exact };
    const relaxed = candidates.map((candidate) => {
      const candidateName = normalizeToyEffectMatchText(candidate.name);
      if (!candidateName || candidateName.length < 6 || normalizedFilename.length < 6) return null;
      if (normalizedFilename.includes(candidateName)) return { candidate, score: candidateName.length + 1000 };
      if (candidateName.includes(normalizedFilename)) return { candidate, score: normalizedFilename.length };
      return null;
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    if (!relaxed.length) return { unmatched: true };
    const best = relaxed[0];
    const tied = relaxed.filter((item) => item.score === best.score && item.candidate.sku !== best.candidate.sku);
    return tied.length ? { ambiguous: [best].concat(tied).map((item) => item.candidate) } : { candidate: best.candidate };
  }

  async function addToyEffectQueueFile(file, candidate, queueOverride) {
    const queue = Array.isArray(queueOverride) ? queueOverride : loadUploadQueue();
    let item = queue.find((entry) => entry.kind === 'toy-effect' && entry.sku === candidate.sku && !/\u6210\u529f/.test(entry.status || ''));
    const key = 'toy-effect:' + candidate.sku + ':' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    await putUploadFile(key, cloneUploadFile(file));
    const effectFiles = getToyEffectUploadEntries(item);
    if (effectFiles.length >= TOY_EFFECT_MAX_FILES) {
      await deleteUploadFile(key);
      return 'limit';
    }
    if (effectFiles.some((entry) => entry.name === file.name)) {
      await deleteUploadFile(key);
      return false;
    }
    const now = new Date().toLocaleString();
    const nextFile = { name: file.name, key, size: file.size || 0, lastModified: file.lastModified || 0 };
    if (!item) {
      const cached = normalizeData(loadData(candidate.sku) || {});
      const next = normalizeData({ ...cached, sku: candidate.sku, brand: candidate.brand || cached.brand || '', name: candidate.name || cached.name || '', projectRowId: candidate.rowId || cached.projectRowId || '' });
      saveDataDirect(candidate.sku, next);
      upsertIndex(next);
      item = {
        id: 'toy-effect-' + candidate.sku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'toy-effect',
        sku: candidate.sku,
        name: buildUploadDisplayName(next, file.name, candidate.sku),
        projectRowId: candidate.rowId || '',
        effectFiles: [nextFile],
        status: '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe',
        step: '\u5f85\u4e0a\u4f20\u5230 BOM \u6548\u679c\u56fe',
        createdAt: now,
        updatedAt: now,
      };
      queue.unshift(item);
    } else {
      item.effectFiles = effectFiles.concat(nextFile);
      item.projectRowId = item.projectRowId || candidate.rowId || '';
      item.status = '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe';
      item.step = '\u5f85\u4e0a\u4f20\u5230 BOM \u6548\u679c\u56fe';
      item.updatedAt = now;
    }
    state.uploadQueue = queue;
    return true;
  }

  async function stageToyEffectUploadFiles(files, options) {
    const stayInMagic = Boolean(options && options.stayInMagic);
    const candidatesFiles = Array.from(files || []).filter(isToyEffectImageFile);
    const supported = candidatesFiles.filter((file) => file.size <= 50 * 1024 * 1024);
    if (!supported.length) {
      showToast(candidatesFiles.length ? '\u73a9\u5177\u6548\u679c\u56fe\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 50MB' : '\u8bf7\u62d6\u5165 JPG / PNG \u73a9\u5177\u6548\u679c\u56fe');
      return;
    }
    try {
      const candidates = await collectToyEffectMatchCandidates(supported);
      const queue = loadUploadQueue();
      const unmatched = [];
      let added = 0;
      for (const file of supported) {
        const resolved = resolveToyEffectFile(file, candidates);
        if (!resolved.candidate) {
          unmatched.push(file.name + (resolved.ambiguous ? '\uff08\u4ea7\u54c1\u540d\u91cd\u590d\uff09' : ''));
          continue;
        }
        const queued = await addToyEffectQueueFile(file, resolved.candidate, queue);
        if (queued === true) added += 1;
        else if (queued === 'limit') unmatched.push(file.name + '（该 SKU 效果图已达 3 张上限）');
      }
      state.uploadMode = 'toy-effect';
      state.uploadView = 'queue';
      if (stayInMagic) {
        state.view = 'magicUpload';
        state.magicUploadMode = 'effect';
      }
      state.uploadPage = 1;
      state.uploadQueue = queue;
      state.toyEffectMatchStatus = unmatched.length ? '\u672a\u5339\u914d\uff1a' + unmatched.slice(0, 4).join('\u3001') + (unmatched.length > 4 ? '\u2026' : '') : '';
      saveUploadQueue();
      renderShell();
      if (added) showToast('\u5df2\u8bc6\u522b\u5e76\u52a0\u5165 ' + added + ' \u5f20\u73a9\u5177\u6548\u679c\u56fe');
      if (unmatched.length) showToast('\u6709 ' + unmatched.length + ' \u5f20\u6548\u679c\u56fe\u672a\u80fd\u552f\u4e00\u5339\u914d\uff0c\u8bf7\u68c0\u67e5\u6587\u4ef6\u540d');
    } catch (error) {
      console.warn('PLM floating helper toy effect image match failed:', error);
      showToast('\u6548\u679c\u56fe\u5339\u914d\u5931\u8d25\uff1a' + (error && error.message ? error.message : '\u8bf7\u68c0\u67e5\u5f53\u524d\u9875\u9762'));
    }
  }

  function inferUploadNameFromFileName(filename, sku) {
    return compactText(String(filename || '').replace(/\.[^.]+$/, '').replace(sku, ''));
  }

  function buildUploadDisplayName(cached, filename, sku) {
    const fromCache = [cached && cached.brand, cached && cached.name].filter(Boolean).join(' ');
    return cleanName(fromCache) || cleanName(inferUploadNameFromFileName(filename, sku));
  }

  function getUploadDisplayName(item) {
    const cached = item && item.sku ? loadData(item.sku) : null;
    const copyrightEntry = getCopyrightUploadEntries(item)[0];
    const effectEntry = getToyEffectUploadEntries(item)[0];
    const filename = (item && (item.xlsxName || item.zipName)) || (copyrightEntry && copyrightEntry.name) || (effectEntry && effectEntry.name) || '';
    const name = buildUploadDisplayName(cached, filename, item && item.sku);
    if (name && item && item.name !== name) {
      item.name = name;
      window.setTimeout(() => {
        const queue = loadUploadQueue();
        const target = queue.find((entry) => entry.id === item.id);
        if (!target || target.name === name) return;
        target.name = name;
        state.uploadQueue = queue.map((entry) => entry.id === item.id ? target : entry);
        saveUploadQueue();
      }, 0);
    }
    return name || (item && item.name) || '';
  }

  function getMissingUploadText(item) {
    if (item && item.kind === 'copyright') return getCopyrightUploadEntries(item).length ? '\u6587\u4ef6\u5df2\u9f50' : '\u7f3a\u7248\u6743\u56fe';
    if (item && item.kind === 'toy-effect') return getToyEffectUploadEntries(item).length ? '\u6548\u679c\u56fe\u6587\u4ef6\u5df2\u9f50' : '\u7f3a\u6548\u679c\u56fe';
    const missing = [];
    if (!item.xlsxKey) missing.push('XLSX');
    if (!item.zipKey) missing.push('ZIP');
    return '\u7f3a ' + missing.join(' + ');
  }

  function getCopyrightUploadEntries(item) {
    return Array.isArray(item && item.copyrightFiles)
      ? item.copyrightFiles.filter((entry) => entry && entry.name)
      : [];
  }

  function getToyEffectUploadEntries(item) {
    return Array.isArray(item && item.effectFiles)
      ? item.effectFiles.filter((entry) => entry && entry.name)
      : [];
  }

  function isUploadItemReady(item) {
    if (!item) return false;
    if (item.kind === 'toy-label') return Boolean(item.xlsxKey && item.zipKey);
    if (item.kind === 'toy-effect') {
      const entries = getToyEffectUploadEntries(item);
      return Boolean(entries.length && entries.every((entry) => entry.key));
    }
    if (item.kind === 'copyright') {
      const entries = getCopyrightUploadEntries(item);
      return Boolean(entries.length && entries.every((entry) => entry.key));
    }
    return Boolean(item.xlsxKey && item.zipKey);
  }

  function removeUploadQueueItem(id) {
    const target = state.uploadQueue.find((item) => item.id === id);
    cleanupUploadFiles(target);
    state.uploadQueue = state.uploadQueue.filter((item) => item.id !== id);
    saveUploadQueue();
    renderShell();
  }

  function retryUploadQueueItem(id) {
    const latestQueue = loadUploadQueue();
    let found = false;
    state.uploadQueue = latestQueue.map((item) => {
      if (item.id !== id) return item;
      found = true;
      const ready = isUploadItemReady(item);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    showToast(L.uploadRetry + '\uff1a\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function toggleUploadSelection(id) {
    if (!id) return;
    const selected = new Set(state.uploadSelectedIds || []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    state.uploadSelectedIds = Array.from(selected);
    renderShell();
  }

  function retryUploadHistoryItem(id) {
    retryUploadHistoryItems([id]);
  }

  function retrySelectedUploads() {
    if (state.uploadView === 'history') retryUploadHistoryItems(state.uploadSelectedIds || []);
    else retryUploadQueueItems(state.uploadSelectedIds || []);
  }

  function deleteSelectedUploads() {
    if (state.uploadView === 'history') deleteUploadHistoryItems(state.uploadSelectedIds || []);
    else deleteUploadQueueItems(state.uploadSelectedIds || []);
  }

  function retryUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const now = new Date().toLocaleString();
    let changed = false;
    state.uploadQueue = loadUploadQueue().map((item) => {
      if (!idSet.has(item.id)) return item;
      changed = true;
      const ready = isUploadItemReady(item);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: now,
      };
    });
    if (!changed) return;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function deleteUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const removed = [];
    state.uploadQueue = loadUploadQueue().filter((item) => {
      if (!idSet.has(item.id)) return true;
      removed.push(item);
      return false;
    });
    removed.forEach(cleanupUploadFiles);
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u5220\u9664\u961f\u5217\u8bb0\u5f55');
  }

  function retryUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const history = loadUploadHistory();
    const targets = history.filter((item) => idSet.has(item.id));
    if (!targets.length) return;
    const queue = loadUploadQueue();
    const now = new Date().toLocaleString();
    targets.forEach((item) => {
      const ready = isUploadItemReady(item);
      queue.unshift({
        ...item,
        id: item.sku + '-retry-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: true,
        completedAt: '',
        updatedAt: now,
        createdAt: now,
      });
    });
    state.uploadQueue = queue;
    state.uploadHistory = history;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    state.uploadView = 'queue';
    renderShell();
    showToast('\u5df2\u6062\u590d\u5230\u961f\u5217' + (targets.some((item) => !isUploadItemReady(item)) ? '\uff0c\u8bf7\u8865\u5145\u6587\u4ef6' : ''));
  }

  function deleteUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    state.uploadHistory = loadUploadHistory().filter((item) => !idSet.has(item.id));
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadHistory();
    renderShell();
    showToast('\u5df2\u5220\u9664\u5386\u53f2\u8bb0\u5f55');
  }

  function startUploadQueue() {
    const mode = normalizeUploadMode(state.uploadMode);
    if (mode === 'toy-effect' && !hasApiUploadAccess()) {
      notifyApiUploadAccessDenied();
      return;
    }
    state.uploadWorkerMode = mode;
    state.uploadRunning = true;
    saveUploadWorkerRunning(mode, true);
    saveUploadQueue();
    state.uploadExpanded = true;
    renderShell();
    showToast(L.uploadQueueStarted);
    const workerUrl = location.origin + '/productManagementProduct?plmUploadWorker=1&plmUploadMode=' + encodeURIComponent(mode);
    if (!isUploadWorkerPage()) window.open(workerUrl, 'plm-upload-worker-' + mode);
    else window.setTimeout(() => processUploadQueue(mode), 800);
  }

  function startMagicEffectQueueInline() {
    const mode = 'toy-effect';
    if (!hasApiUploadAccess()) {
      notifyApiUploadAccessDenied();
      return;
    }
    state.uploadMode = mode;
    state.uploadWorkerMode = mode;
    state.uploadRunning = true;
    saveUploadWorkerRunning(mode, true);
    saveUploadQueue();
    state.view = 'magicUpload';
    state.magicUploadMode = 'effect';
    renderShell();
    showToast('效果图后台队列已开始');
    window.setTimeout(() => processUploadQueue(mode), 80);
  }

  function retryMagicEffectQueueItem(id) {
    const queue = loadUploadQueue();
    let found = false;
    state.uploadQueue = queue.map((item) => {
      if (item.id !== id || getUploadItemMode(item) !== 'toy-effect') return item;
      found = true;
      return {
        ...item,
        status: isUploadItemReady(item) ? '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe' : '\u7f3a\u6587\u4ef6',
        step: isUploadItemReady(item) ? '\u7b49\u5f85\u91cd\u8bd5\uff0c\u5c06\u91cd\u65b0\u67e5\u8be2\u9879\u76ee ID' : getMissingUploadText(item),
        skipReason: '',
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    startMagicEffectQueueInline();
  }

  function clearMagicEffectQueue() {
    const queue = loadUploadQueue();
    const removed = queue.filter((item) => getUploadItemMode(item) === 'toy-effect');
    removed.forEach(cleanupUploadFiles);
    state.uploadQueue = queue.filter((item) => getUploadItemMode(item) !== 'toy-effect');
    state.uploadMode = 'toy-effect';
    state.uploadRunning = false;
    saveUploadWorkerRunning('toy-effect', false);
    saveUploadQueue();
    renderShell();
    showToast('效果图队列已清空');
  }

  function pauseUploadQueue() {
    const mode = getUploadControlMode();
    state.uploadWorkerMode = mode;
    state.uploadRunning = false;
    saveUploadWorkerRunning(mode, false);
    resetRunningUploadsToPending(mode);
    saveUploadQueue();
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  async function finishUploadQueue(mode) {
    const uploadMode = normalizeUploadMode(mode || getUploadControlMode());
    await closeCancelConfigModalIfPresent();
    state.uploadRunning = false;
    state.uploadWorkerMode = uploadMode;
    saveUploadWorkerRunning(uploadMode, false);
    moveCompletedUploadsToHistory(uploadMode);
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    if (uploadMode === 'toy-label') {
      const toyLabelManifest = loadToyLabelExportManifest();
      if (toyLabelManifest.downloaded) await clearToyLabelExportManifest(toyLabelManifest);
      else await downloadToyLabelBatchArchive();
    }
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  function clearCurrentUploadList() {
    state.uploadClearConfirmOpen = true;
    renderShell();
  }

  function confirmClearCurrentUploadList() {
    const mode = normalizeUploadMode(state.uploadMode);
    state.uploadClearConfirmOpen = false;
    if (state.uploadView === 'history') {
      state.uploadHistory = loadUploadHistory().filter((item) => getUploadItemMode(item) !== mode);
      state.uploadHistoryPage = 1;
      state.uploadSelectedIds = [];
      saveUploadHistory();
      renderShell();
      showToast('\u5386\u53f2\u8bb0\u5f55\u5df2\u6e05\u7a7a');
      return;
    }
    const queue = loadUploadQueue();
    const removed = queue.filter((item) => getUploadItemMode(item) === mode);
    removed.forEach(cleanupUploadFiles);
    state.uploadQueue = queue.filter((item) => getUploadItemMode(item) !== mode);
    state.uploadPage = 1;
    state.uploadSelectedIds = [];
    state.uploadRunning = false;
    saveUploadWorkerRunning(mode, false);
    saveUploadQueue();
    renderShell();
    showToast('\u961f\u5217\u5df2\u6e05\u7a7a');
  }

  function resetRunningUploadsToPending(mode) {
    const targetMode = normalizeUploadMode(mode || getUploadControlMode());
    const queue = loadUploadQueue();
    state.uploadQueue = queue.map((item) => {
      if (getUploadItemMode(item) !== targetMode) return item;
      if (!/\u8fdb\u884c\u4e2d/.test(item.status || '')) return item;
      const ready = isUploadItemReady(item);
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        updatedAt: new Date().toLocaleString(),
      };
    });
  }

  function updateUploadItem(item, status, step, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    if (extra && typeof extra === 'object') Object.assign(latestItem, extra);
    latestItem.status = status || latestItem.status;
    latestItem.step = step || '';
    latestItem.updatedAt = new Date().toLocaleString();
    Object.assign(item, latestItem);
    const cleanedQueue = /\u8fdb\u884c\u4e2d/.test(latestItem.status || '')
      ? archiveOtherRunningUploads(latestQueue, latestItem)
      : latestQueue;
    state.uploadQueue = cleanedQueue.some((entry) => entry.id === item.id)
      ? cleanedQueue.map((entry) => entry.id === item.id ? latestItem : entry)
      : [latestItem].concat(cleanedQueue);
    saveUploadQueue();
    renderShell();
  }

  function getCurrentRunningUpload(queue, mode) {
    const targetMode = mode ? normalizeUploadMode(mode) : '';
    return (queue || [])
      .filter((item) => !targetMode || getUploadItemMode(item) === targetMode)
      .filter((item) => /\u8fdb\u884c\u4e2d/.test(item.status || ''))
      .sort((a, b) => getUploadTimeMs(b) - getUploadTimeMs(a))[0] || null;
  }

  function getUploadTimeMs(item) {
    const value = item && (item.updatedAt || item.createdAt || item.completedAt);
    const ms = Date.parse(value || '');
    return Number.isFinite(ms) ? ms : 0;
  }

  function archiveOtherRunningUploads(queue, activeItem) {
    const activeMode = getUploadItemMode(activeItem);
    const stale = (queue || []).filter((entry) => entry.id !== activeItem.id && getUploadItemMode(entry) === activeMode && /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
    if (!stale.length) return queue;
    const now = new Date().toLocaleString();
    return (queue || []).map((entry) => {
      if (!stale.some((item) => item.id === entry.id)) return entry;
      if (entry.kind === 'toy-label') {
        return {
          ...entry,
          status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
          step: '\u7b49\u5f85\u5904\u7406',
          updatedAt: now,
        };
      }
      const ready = isUploadItemReady(entry);
      return {
        ...entry,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(entry),
        updatedAt: now,
      };
    });
  }

  function normalizeRunningUploadsInQueue() {
    const queue = loadUploadQueue();
    let normalizedQueue = queue;
    UPLOAD_MODES.forEach((mode) => {
      const running = normalizedQueue.filter((entry) => getUploadItemMode(entry) === mode && /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
      if (running.length <= 1) return;
      const active = getCurrentRunningUpload(running, mode);
      normalizedQueue = archiveOtherRunningUploads(normalizedQueue, active);
    });
    if (normalizedQueue === queue) return;
    state.uploadQueue = normalizedQueue;
    saveUploadQueue();
  }

  async function prepareToyLabelBatchQueue(queue) {
    const items = (queue || []).filter((entry) => entry.kind === 'toy-label' && entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
    if (!items.length) return true;
    const skus = Array.from(new Set(items.map((item) => String(item.sku || '').toUpperCase()).filter(Boolean)));
    const signature = skus.join('|');
    await ensureToyLabelExportRun(signature);
    const prepared = state.toyLabelBatchRows || {};
    if (state.toyLabelBatchPreparedSignature === signature && skus.every((sku) => prepared[sku] && prepared[sku].productImageUrl)) return true;
    // Manually added products have no design-task row; their cached effect image is enough for the local label package.
    const cachedManualRows = new Map();
    const searchSkus = [];
    skus.forEach((sku) => {
      const cached = normalizeData(loadData(sku) || (state.index || []).find((entry) => entry && entry.sku === sku) || { sku });
      const cachedImageUrl = getManualToyLabelCachedEffectImage(cached);
      if (cachedImageUrl) cachedManualRows.set(sku, {
        sku,
        rowId: String(cached.projectRowId || cached.projectId || '').trim(),
        brand: cached.brand || '',
        name: cached.name || '',
        productImageUrl: cachedImageUrl,
        source: 'cached-effect-image',
      });
      else searchSkus.push(sku);
    });
    let rows = [];
    let searchUnavailable = false;
    if (searchSkus.length) {
      if (!(await ensureNewProductProjectPage()) || !(await ensureDesignTaskTab())) {
        searchUnavailable = true;
        addLog(cachedManualRows.size ? 'warn' : 'error', cachedManualRows.size ? '玩具标签：设计任务不可用，继续使用手动 SKU 缓存效果图' : '玩具标签：无法进入设计任务批量搜索', searchSkus.join(' '));
      } else {
        const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
        const button = findButtonByText('\u67e5\u8be2');
        if (!input || !button) {
          searchUnavailable = true;
          addLog(cachedManualRows.size ? 'warn' : 'error', cachedManualRows.size ? '玩具标签：未找到设计任务搜索框，继续使用手动 SKU 缓存效果图' : '玩具标签：未找到商品编码批量搜索框', '');
        } else {
          addLog('info', '玩具标签：批量搜索设计任务', searchSkus.length + '个编码');
          setNativeInputValue(input, searchSkus.join(' '));
          clickElement(button);
          await wait(450);
          await waitFor(() => collectToyLabelBatchRows(searchSkus).length > 0 || (!isProjectResultLoading() && hasProjectResultEmptyState()), 12000, 180);
          await expandProjectResultPageSize(searchSkus.length);
          await wait(350);
          rows = collectToyLabelBatchRows(searchSkus);
        }
      }
    }
    if (searchUnavailable && !cachedManualRows.size) return false;
    const rowMap = {};
    cachedManualRows.forEach((row, sku) => {
      rowMap[sku] = row;
    });
    rows.forEach((row) => {
      rowMap[row.sku] = row;
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const imageUrl = stripOssResizeParams(row.productImageUrl || '');
      const next = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: row.name || previous.name || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        toyLabelProductImageUrl: imageUrl || row.productImageUrl || '',
        toyLabelProductImageFallbackUrl: row.productImageUrl || imageUrl || '',
        updatedAt: previous.updatedAt || new Date().toLocaleString(),
        updatedAtMs: previous.updatedAtMs || Date.now(),
      });
      saveDataDirect(row.sku, next);
      upsertIndex(next);
    });
    state.toyLabelBatchRows = rowMap;
    state.toyLabelBatchPreparedSignature = signature;
    state.uploadQueue = loadUploadQueue().map((entry) => {
      if (entry.kind !== 'toy-label' || !rowMap[entry.sku] || !rowMap[entry.sku].productImageUrl) return entry;
      const cached = loadData(entry.sku);
      const cachedRow = rowMap[entry.sku];
      const usesCachedEffectImage = cachedRow.source === 'cached-effect-image';
      return {
        ...entry,
        name: buildUploadDisplayName(cached, '', entry.sku),
        manualPackageOnly: usesCachedEffectImage || Boolean(entry.manualPackageOnly),
        step: usesCachedEffectImage ? '\u5df2\u8bfb\u53d6\u7f13\u5b58\u6548\u679c\u56fe\uff0c\u7b49\u5f85\u751f\u6210\u6807\u7b7e\u96c6\u5408\u5305' : '\u5df2\u83b7\u53d6\u5546\u54c1\u56fe\u7247\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM',
        updatedAt: new Date().toLocaleString(),
      };
    });
    saveUploadQueue();
    queueCloudBackup();
    const missing = skus.filter((sku) => !rowMap[sku]);
    const missingImage = rows.filter((row) => !row.productImageUrl).map((row) => row.sku);
    const unavailable = new Map();
    missing.forEach((sku) => unavailable.set(sku, searchUnavailable ? '\u8bbe\u8ba1\u4efb\u52a1\u4e0d\u53ef\u7528\uff0c\u65e0\u6cd5\u8bfb\u53d6\u5546\u54c1\u884c' : '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u672a\u627e\u5230\u5546\u54c1\u884c'));
    missingImage.forEach((sku) => unavailable.set(sku, '\u8bbe\u8ba1\u4efb\u52a1\u4e2d\u672a\u627e\u5230 SKU \u5546\u54c1\u56fe'));
    if (unavailable.size) {
      const fallbackReason = '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u672a\u627e\u5230\u5546\u54c1\u56fe\u7247\u6216\u884c\u6570\u636e';
      state.uploadQueue = loadUploadQueue().map((entry) => entry.kind === 'toy-label' && unavailable.has(entry.sku)
        ? { ...entry, status: L.uploadFailed, step: unavailable.get(entry.sku) || fallbackReason, skipReason: unavailable.get(entry.sku) || fallbackReason, updatedAt: new Date().toLocaleString() }
        : entry);
      saveUploadQueue();
    }
    await prepareAndDownloadToyLabelBatch(items.filter((item) => rowMap[item.sku] && rowMap[item.sku].productImageUrl), signature);
    const diagnostics = [];
    if (missing.length) diagnostics.push('\u672a\u627e\u5230 ' + missing.join(' '));
    if (missingImage.length) diagnostics.push('\u7f3a\u5c11 SKU \u56fe ' + missingImage.join(' '));
    const cachedEffectSkus = Array.from(cachedManualRows.keys());
    const notices = cachedEffectSkus.length ? ['\u624b\u52a8 SKU \u4f7f\u7528\u7f13\u5b58\u6548\u679c\u56fe ' + cachedEffectSkus.join(' ')] : [];
    const detail = diagnostics.concat(notices);
    addLog(diagnostics.length ? 'warn' : 'success', '玩具标签：批量数据已读取', rows.length + cachedEffectSkus.length + '/' + skus.length + (detail.length ? '\uff0c' + detail.join('\uff0c') : ''));
    renderShell();
    return rows.some((row) => Boolean(row.productImageUrl)) || cachedManualRows.size > 0;
  }

  async function prepareAndDownloadToyLabelBatch(items, signature) {
    let manifest = loadToyLabelExportManifest();
    for (const item of items || []) {
      const sku = String(item && item.sku || '').toUpperCase();
      if (!sku || manifest.files.filter((entry) => entry.sku === sku).length >= 3) continue;
      const data = normalizeData(loadData(sku) || (state.index || []).find((entry) => entry && entry.sku === sku) || {});
      if (!data.sku) continue;
      const manualPackageOnly = isManualSkuProductEffectRoute(data);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u751f\u6210\u6807\u7b7e\u6253\u5305\u6587\u4ef6');
      state.selectedSku = data.sku;
      state.sku = data.sku;
      state.data = data;
      state.view = 'detail';
      resetExcelState();
      const generated = await generateToyLabelFromCurrent({
        collectFiles: state.toyLabelBatchFiles,
        batchSignature: signature,
        skipExcelPrepare: true,
        skipBomUpload: true,
        batchRowOnly: true,
      });
      if (!generated) markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u6587\u4ef6\u751f\u6210\u5931\u8d25');
      else updateUploadItem(item, '\u5f85\u4e0a\u4f20', manualPackageOnly ? '\u5df2\u751f\u6210\u6807\u7b7e\u96c6\u5408\u5305\uff0c\u624b\u52a8 SKU \u8df3\u8fc7 BOM \u4e0a\u4f20' : '\u5df2\u6253\u5305\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM');
      manifest = loadToyLabelExportManifest();
    }
    if (!manifest.files.length || manifest.downloaded) return;
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u56fe\u7247\u5df2\u83b7\u53d6\uff0c\u5148\u4e0b\u8f7d ZIP', manifest.files.length + '\u4e2a\u6587\u4ef6');
    await downloadToyLabelBatchArchive({ keepStagedFiles: true });
  }

  function collectToyLabelBatchRows(requestedSkus) {
    const requested = new Set((requestedSkus || []).map((sku) => String(sku || '').toUpperCase()));
    const header = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => cells.some((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, '') === '\u5546\u54c1\u56fe\u7247')) || [];
    const headerNames = header.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
    const skuIndex = headerNames.indexOf('\u5546\u54c1\u7f16\u7801');
    const brandIndex = headerNames.indexOf('\u54c1\u724c');
    const nameIndex = headerNames.indexOf('\u5546\u54c1\u540d\u79f0');
    const imageIndex = headerNames.indexOf('\u5546\u54c1\u56fe\u7247');
    if (skuIndex < 0 || imageIndex < 0) return [];
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body) return [];
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const image = cells[imageIndex] && cells[imageIndex].querySelector('img');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        brand: brandIndex >= 0 && cells[brandIndex] ? compactText(cells[brandIndex].innerText || cells[brandIndex].textContent) : '',
        name: nameIndex >= 0 && cells[nameIndex] ? compactText(cells[nameIndex].innerText || cells[nameIndex].textContent) : '',
        productImageUrl: image ? (image.currentSrc || image.src || image.getAttribute('src') || '') : '',
      };
    }).filter((row) => row.sku && requested.has(row.sku) && row.rowId);
  }

  function isProjectResultLoading() {
    return Array.from(document.querySelectorAll('.vxe-loading--wrapper, .ant-spin-spinning, .vxe-table--loading')).some(isVisibleElement);
  }

  function hasProjectResultEmptyState() {
    return Array.from(document.querySelectorAll('.vxe-table--empty-content, .vxe-table--empty-block, .ant-empty'))
      .filter(isVisibleElement)
      .some((el) => /\u6682\u65e0\u6570\u636e|\u6682\u65e0|No Data/i.test(compactText(el.innerText || el.textContent)));
  }

  async function expandProjectResultPageSize(minimum) {
    const requestedSize = Number(minimum) || 20;
    const selector = Array.from(document.querySelectorAll('.ant-select-selector'))
      .filter(isVisibleElement)
      .find((el) => /\d+\s*\u6761\s*\/\s*\u9875/.test(compactText(el.innerText || el.textContent)));
    if (!selector) return;
    const current = Number((compactText(selector.innerText || selector.textContent).match(/\d+/) || [])[0]) || 20;
    if (requestedSize <= 20 && current <= PROJECT_RESULT_MAX_PAGE_SIZE) return;
    const targetSize = current > PROJECT_RESULT_MAX_PAGE_SIZE
      ? PROJECT_RESULT_MAX_PAGE_SIZE
      : Math.min(Math.max(requestedSize, 20), PROJECT_RESULT_MAX_PAGE_SIZE);
    if (current === targetSize) return;
    clickElement(selector);
    let options = [];
    try {
      options = await waitUntil(() => {
        const found = Array.from(document.querySelectorAll('.ant-select-item-option, [role="option"]'))
          .filter(isVisibleElement)
          .map((el) => ({ el, size: Number((compactText(el.innerText || el.textContent).match(/\d+/) || [])[0]) || 0 }))
          .filter((item) => item.size && item.size !== current);
        return found.length ? found : null;
      }, 2500, 100);
    } catch (error) {
      return;
    }
    if (!options.length) return;
    options.sort((a, b) => a.size - b.size);
    const target = current > targetSize
      ? options.filter((item) => item.size <= targetSize).pop() || options[0]
      : options.find((item) => item.size >= targetSize) || options[options.length - 1];
    clickElement(target.el);
    await waitFor(() => !isProjectResultLoading(), 8000, 180);
  }

  async function processUploadQueue(mode) {
    const workerMode = normalizeUploadMode(mode || (isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : state.uploadMode));
    state.uploadWorkerMode = workerMode;
    state.uploadRunning = loadUploadWorkerRunning(workerMode);
    state.uploadQueue = loadUploadQueue();
    if (!state.uploadRunning || state.uploadProcessing) return;
    state.uploadProcessing = true;
    const attemptedTaskKeys = new Set();
    try {
      if (workerMode === 'toy-effect') {
        const accessReady = await waitFor(() => !state.magicUploadAccessLoading, 8000, 100);
        if (!accessReady || !hasApiUploadAccess()) {
          state.uploadRunning = false;
          saveUploadWorkerRunning(workerMode, false);
          addLog('warn', '后台效果图队列已拦截', '当前账号没有后台上传权限；普通图包表格仍可使用旧脚本流程');
          showToast('当前账号没有后台上传权限，已停止效果图后台队列');
          renderShell();
          return;
        }
      }
      if (workerMode === 'toy-label') {
        const prepared = await prepareToyLabelBatchQueue(state.uploadQueue.filter((entry) => getUploadItemMode(entry) === workerMode));
        if (!prepared) {
          state.uploadRunning = false;
          state.uploadWorkerMode = workerMode;
          saveUploadWorkerRunning(workerMode, false);
          state.uploadQueue = loadUploadQueue();
          addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u6279\u91cf\u6570\u636e\u672a\u8bfb\u53d6\uff0c\u5df2\u6682\u505c\u4e0a\u4f20', '\u672a\u6267\u884c BOM \u4e0a\u4f20');
          showToast('\u6279\u91cf\u8bbe\u8ba1\u4efb\u52a1\u6570\u636e\u672a\u8bfb\u53d6\uff0c\u5df2\u6682\u505c\uff0c\u672a\u6267\u884c\u4e0a\u4f20');
          renderShell();
          return;
        }
      }
      while (state.uploadRunning) {
        if (await recoverPurchaseEmptyRunningUpload(workerMode)) {
          state.uploadRunning = loadUploadWorkerRunning(workerMode);
          state.uploadQueue = loadUploadQueue();
          continue;
        }
        const pendingItems = state.uploadQueue.filter((entry) => getUploadItemMode(entry) === workerMode && isUploadItemReady(entry) && !attemptedTaskKeys.has(uploadHistoryKey(entry)) && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
        const item = pendingItems[0];
        if (!item) {
          await finishUploadQueue(workerMode);
          break;
        }
        attemptedTaskKeys.add(uploadHistoryKey(item));
        if (workerMode !== 'toy-effect') await ensureUploadPageReadyForNextItem();
        try {
          await runUploadQueueItem(item);
        } catch (error) {
          if (await recoverPurchaseEmptyRunningUpload(workerMode)) {
            state.uploadRunning = loadUploadWorkerRunning(workerMode);
            state.uploadQueue = loadUploadQueue();
            continue;
          }
          if (isReviewConfirmWaitError(error)) {
            pauseUploadAfterReviewConfirmTimeout(item, error);
            state.uploadRunning = loadUploadWorkerRunning(workerMode);
            state.uploadQueue = loadUploadQueue();
            continue;
          }
          const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
          console.warn('PLM floating helper upload queue item failed, continue next:', error);
          markUploadQueueBlocked(item, L.uploadFailed, message);
          let closeFailure = null;
          if (workerMode !== 'toy-effect') {
            try {
              await closeTopProductDrawer({ skipDraftSave: true });
            } catch (closeError) {
              closeFailure = closeError;
              console.warn('PLM floating helper close failed after item error:', closeError);
            }
          }
          if (closeFailure || getVisibleModal() || getOpenProductDrawer()) {
            const closeMessage = closeFailure && closeFailure.message
              ? closeFailure.message
              : '\u5f53\u524d\u5546\u54c1\u9875\u6216\u5f39\u7a97\u672a\u5b8c\u5168\u5173\u95ed';
            state.uploadRunning = false;
            saveUploadWorkerRunning(workerMode, false);
            markUploadQueueBlocked(item, L.uploadFailed, message + '\uff1b' + closeMessage + '\uff0c\u5df2\u6682\u505c');
            addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + closeMessage);
            showToast('\u5f53\u524d\u5546\u54c1\u9875\u6216\u5f39\u7a97\u672a\u5173\u95ed\uff0c\u5df2\u6682\u505c\u961f\u5217');
          }
        }
        state.uploadRunning = loadUploadWorkerRunning(workerMode);
        state.uploadQueue = loadUploadQueue();
      }
    } finally {
      await closeCancelConfigModalIfPresent().catch((error) => console.warn('PLM floating helper final modal cleanup failed:', error));
      state.uploadProcessing = false;
      if (loadUploadWorkerRunning(workerMode)) {
        window.setTimeout(() => processUploadQueue(workerMode), 800);
      }
    }
  }

  async function runToyLabelQueueItem(item) {
    const data = normalizeData(loadData(item && item.sku) || (state.index || []).find((entry) => entry && entry.sku === (item && item.sku)) || {});
    if (!data.sku) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u4e2d\u672a\u627e\u5230\u8be5 SKU');
      return;
    }
    const manualPackageOnly = isManualSkuProductEffectRoute(data);
    const hasProductImage = Boolean(data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl || getProductThumbUrl(data));
    if ((!manualPackageOnly && !data.projectRowId) || !hasProductImage) {
      markUploadQueueBlocked(item, L.uploadFailed, manualPackageOnly ? '\u624b\u52a8 SKU \u7f3a\u5c11\u7f13\u5b58\u6548\u679c\u56fe' : '\u8bbe\u8ba1\u4efb\u52a1\u641c\u7d22\u7ed3\u679c\u4e2d\u672a\u627e\u5230\u5546\u54c1\u56fe\u7247\u6216\u884c\u6807\u8bc6');
      return;
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', manualPackageOnly ? '\u4f7f\u7528\u7f13\u5b58\u6548\u679c\u56fe\u751f\u6210\u6807\u7b7e\u96c6\u5408\u5305' : '\u4f7f\u7528\u8bbe\u8ba1\u4efb\u52a1\u5546\u54c1\u56fe\u7247', manualPackageOnly ? { manualPackageOnly: true } : undefined);
    state.selectedSku = data.sku;
    state.sku = data.sku;
    state.data = data;
    state.view = 'detail';
    resetExcelState();
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', manualPackageOnly ? '\u5df2\u6253\u5305\uff0c\u624b\u52a8 SKU \u65e0\u9700\u4e0a\u4f20 BOM' : '\u4e0a\u4f20\u5df2\u6253\u5305\u7684\u6807\u7b7e\u5230 BOM');
    const stagedPreview = await getStagedToyLabelPreview(data.sku);
    let completed = false;
    if (manualPackageOnly) {
      completed = Boolean(stagedPreview);
      if (!completed) {
        completed = await generateToyLabelFromCurrent({ collectFiles: state.toyLabelBatchFiles, batchSignature: state.toyLabelBatchPreparedSignature, skipExcelPrepare: true, skipBomUpload: true, batchRowOnly: true });
        if (completed) await downloadToyLabelBatchArchive({ keepStagedFiles: true });
      }
    } else if (stagedPreview) {
      try {
        await uploadToyLabelPreviewToBom(data, stagedPreview.blob, stagedPreview.filename, { batchRowOnly: true });
        completed = true;
      } catch (error) {
        console.warn('PLM floating helper staged toy label upload failed:', error);
      }
    } else {
      completed = await generateToyLabelFromCurrent({ collectFiles: state.toyLabelBatchFiles, batchSignature: state.toyLabelBatchPreparedSignature, skipExcelPrepare: true, batchRowOnly: true });
    }
    if (!completed) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6216 BOM \u4e0a\u4f20\u5931\u8d25');
      return;
    }
    archiveUploadItem(item);
    addLog('success', manualPackageOnly ? '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\u96c6\u5408\u5305\u5b8c\u6210' : '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\u5b8c\u6210', data.sku);
  }

  async function getStagedToyLabelPreview(sku) {
    const manifest = loadToyLabelExportManifest();
    const entry = manifest.files.find((file) => file.sku === String(sku || '').toUpperCase() && /\.jpg$/i.test(file.filename) && !/\u5370\u5237/.test(file.filename));
    if (!entry) return null;
    const blob = await getUploadFile(entry.key).catch(() => null);
    return blob ? { filename: entry.filename, blob } : null;
  }

  function getToyEffectProjectId(data) {
    return getProjectIdForMaterialApi(data) || String(data && (data.projectRowId || data.projectId || data.id) || '');
  }

  function isManualSkuProductEffectRoute(data) {
    return Boolean(data && (data.skuListSource === 'manual-code' || data.manualSkuAddedAt || data.manualSkuAddedAtMs));
  }

  function getManualToyLabelCachedEffectImage(data) {
    if (!isManualSkuProductEffectRoute(data) || data.skuImageSource !== 'effectImage') return '';
    return [data.skuImageUrl, data.skuImageFallbackUrl]
      .map((value) => stripOssResizeParams(String(value || '').trim()))
      .find((value) => value && !/^data:image\//i.test(value)) || '';
  }

  async function resolveToyEffectProjectData(item) {
    const sku = String(item && item.sku || '').trim().toUpperCase();
    const cached = loadData(sku) || (state.index || []).find((entry) => entry.sku === sku) || {};
    let data = normalizeData({
      ...cached,
      sku: cached.sku || sku,
      name: cached.name || (item && item.name) || '',
      projectRowId: cached.projectRowId || (item && item.projectRowId) || '',
    });
    let projectId = getToyEffectProjectId(data);
    let project = null;
    if (!projectId || !/^\d+$/.test(projectId)) {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6b63\u5728\u6309 SKU \u67e5\u8be2\u9879\u76ee ID');
      project = await fetchApiProjectSnapshot(data, { force: true });
      projectId = String(project && project.projectId || '').trim();
    }
    if (!projectId || !/^\d+$/.test(projectId)) throw new Error('\u672a\u627e\u5230 ' + sku + ' \u5bf9\u5e94\u7684\u9879\u76ee ID\uff0c\u65e0\u6cd5\u4fdd\u5b58 BOM \u6548\u679c\u56fe');
    data = normalizeData({
      ...data,
      projectRowId: projectId,
      projectId,
      brand: data.brand || project && project.brand || '',
      name: data.name || project && project.name || '',
      referenceUrl: project && project.referenceUrl || data.referenceUrl || '',
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    });
    saveData(sku, data, { changeSource: '\u9b54\u6cd5\u4e0a\u4f20\u8865\u5168\u9879\u76ee ID' });
    if (item) updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5df2\u5339\u914d\u9879\u76ee ID\uff1a' + projectId, { projectRowId: projectId });
    return data;
  }

  async function saveToyEffectPicturesByApi(data, objectNames) {
    const projectId = getToyEffectProjectId(data);
    if (!projectId) throw new Error('缺少项目 ID，无法保存 BOM 效果图');
    const paths = (Array.isArray(objectNames) ? objectNames : [objectNames]).map(normalizeMagicUploadEffectPath).filter(Boolean);
    if (!paths.length) return;
    const [materialsPayload, existingPayload] = await Promise.all([
      fetchPlmJson('/api/ChemicalNewDesignTask/GetProjectPMJoinList?id=' + encodeURIComponent(projectId)),
      fetchPlmJson('/api/ChemicalNew/GetProjectEffectPicture?id=' + encodeURIComponent(projectId)),
    ]);
    const materials = Array.isArray(materialsPayload && materialsPayload.data) ? materialsPayload.data : [];
    if (!materials.length) throw new Error('未读取到 BOM 物料列表，无法保存效果图');
    const previousPaths = getMagicToyLabelEffectPicturePaths(existingPayload);
    const effectPictureFiles = [];
    const seen = new Set();
    const addPath = (value) => {
      const normalized = normalizeMagicUploadEffectPath(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      effectPictureFiles.push(normalized);
    };
    paths.forEach(addPath);
    await fetchPlmApiJson('/api/ChemicalNewBom/MaterialBatchSaveAndSyncToProduct', {
      project_id: Number(projectId) || projectId,
      materials: materials.map(buildMagicUploadBomMaterialPayload),
      effect_picture_files: effectPictureFiles,
    });
    return { replacedCount: previousPaths.length, savedCount: effectPictureFiles.length };
  }

  function buildToyEffectProductDraft(infoPayload, pricePayload, invoicePayload, procurePayload, contentPayload, productContext, objectNames, manualPacking) {
    const info = getMagicUploadPayloadData(infoPayload);
    const price = getMagicUploadPayloadData(pricePayload);
    const invoice = getMagicUploadPayloadData(invoicePayload);
    const values = flattenMagicUploadProductAttributes(contentPayload);
    if (!values.length) throw new Error('未读取到商品模板字段，无法保存商品效果图');
    const target = values.find((item) => Number(item && item.attr_id) === 148 && Number(item && item.language_id) === 1)
      || values.find((item) => compactText(item && item.attr_name) === '图片' && Number(item && item.language_id) === 1);
    if (!target) throw new Error('商品模板中未找到图片字段 attr_id=148');
    const paths = (Array.isArray(objectNames) ? objectNames : [objectNames])
      .map(normalizeMagicUploadEffectPath)
      .filter(Boolean)
      .map((path) => '/' + path);
    if (!paths.length) throw new Error('商品效果图 OSS 路径为空');
    const replacedCount = magicUploadDraftValueList(target.value).filter(Boolean).length;
    target.value = paths;
    const packingSummary = manualPacking ? applyManualToyEffectPacking(values, manualPacking) : { changed: [], source: null };
    const field = (key, fallback) => info[key] === undefined ? fallback : cloneMagicUploadDraftValue(info[key]);
    const procureFallback = Array.isArray(info.product_procure_infos) ? info.product_procure_infos : [];
    return {
      _toyEffectReplacedCount: replacedCount,
      _toyEffectPackingSummary: packingSummary,
      procurement_price: price.procurement_price === undefined ? field('procurement_price', null) : price.procurement_price,
      invoice_item_name: invoice.invoice_item_name === undefined ? field('invoice_item_name', null) : invoice.invoice_item_name,
      invoice_category: invoice.invoice_category === undefined ? field('invoice_category', null) : invoice.invoice_category,
      product_procure_infos: sanitizeMagicUploadProcureInfos(getMagicUploadProcureList(procurePayload, procureFallback)),
      is_need_to_process_product_procure_infos: true,
      product_version_id: Number(info.product_version_id || productContext.productVersionId) || info.product_version_id || productContext.productVersionId,
      product_id: Number(productContext.productId) || productContext.productId,
      code: field('code', productContext.productCode),
      language_config: field('language_config', []),
      product_type: field('product_type', 1),
      same_style_code: field('same_style_code', null),
      style_code: field('style_code', productContext.productCode),
      is_AMZ: field('is_AMZ', false),
      brand_id: field('brand_id', null),
      category_id: field('category_id', null),
      product_group_id: field('product_group_id', null),
      virtual_classification: field('virtual_classification', null),
      financial_settlement_classification: field('financial_settlement_classification', null),
      jst_old_code: field('jst_old_code', null),
      basic_unit_id: field('basic_unit_id', null),
      purchase_unit_id: field('purchase_unit_id', null),
      sale_unit_id: field('sale_unit_id', null),
      purchase_conversion: field('purchase_conversion', null),
      sale_conversion: field('sale_conversion', null),
      is_SRS: field('is_SRS', false),
      srs_code: field('srs_code', null),
      data_source: field('data_source', null),
      srs_product_code: field('srs_product_code', null),
      srs_store_information: field('srs_store_information', null),
      srs_store_supplier: field('srs_store_supplier', null),
      attr_values: values.map((item) => ({ attr_id: item.attr_id, language_id: item.language_id, value: cloneMagicUploadDraftValue(item.value) })),
    };
  }

  async function saveToyEffectPicturesToProductByApi(item, data, objectNames, productContext, manualPacking) {
    const context = productContext || await resolveMagicUploadProductContext(item);
    const infoPath = '/api/Product/GetDetailInfoByEdit?product_id=' + encodeURIComponent(context.productId) + '&product_version_id=' + encodeURIComponent(context.productVersionId);
    const infoPayload = await fetchPlmJson(infoPath);
    const info = getMagicUploadPayloadData(infoPayload);
    const categoryId = info.category_id || context.categoryId;
    if (!categoryId) throw new Error('目标商品缺少 category_id，无法保存效果图');
    const withVersion = (path) => path + '&product_version_id=' + encodeURIComponent(context.productVersionId);
    const [contentPayload, pricePayload, invoicePayload, procurePayload] = await Promise.all([
      fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(context.productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(context.productVersionId)),
      fetchPlmJson(withVersion('/api/Product/GetProductPriceInfo?type=1')),
      fetchPlmJson(withVersion('/api/Product/GetProductInvoiceInfo?type=1')),
      fetchPlmJson('/api/ProductProcureInfo/GetProductProcureInfo?type=1&product_version_id=' + encodeURIComponent(context.productVersionId) + '&code=' + encodeURIComponent(context.sku)),
    ]);
    const draft = buildToyEffectProductDraft(infoPayload, pricePayload, invoicePayload, procurePayload, contentPayload, context, objectNames, manualPacking);
    const replacedCount = Number(draft._toyEffectReplacedCount) || 0;
    const packingSummary = draft._toyEffectPackingSummary || { changed: [], source: null };
    delete draft._toyEffectReplacedCount;
    delete draft._toyEffectPackingSummary;
    await fetchPlmApiJson('/api/Product/SaveProductDraftByEdit', draft);
    await fetchPlmApiJson('/api/Product/Arraign', { product_id: Number(context.productId) || context.productId });
    const firstPath = (Array.isArray(objectNames) ? objectNames : [objectNames]).map(normalizeMagicUploadEffectPath).find(Boolean) || '';
    const imageUrl = firstPath ? buildApiArchiveFileUrl(firstPath) : '';
    const next = normalizeData({
      ...(data || {}),
      productId: String(context.productId || data && data.productId || ''),
      productVersionId: String(context.productVersionId || data && data.productVersionId || ''),
      skuImageUrl: imageUrl || data && data.skuImageUrl || '',
      skuImageFallbackUrl: imageUrl || data && data.skuImageFallbackUrl || '',
      skuImageSource: imageUrl ? 'effectImage' : data && data.skuImageSource || '',
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    });
    saveData(context.sku, next, { changeSource: '魔法上传商品效果图' });
    upsertDailyLedgerFromData(next, { status: '待定稿', stage: '待定稿' });
    return { data: next, replacedCount, packingSummary, savedCount: (Array.isArray(objectNames) ? objectNames : [objectNames]).filter(Boolean).length };
  }

  async function uploadToyEffectFileByApi(item, data, entry, file, index, total, options) {
    const opts = options || {};
    const uploadFileType = Number(opts.uploadFileType) || 40;
    const routeLabel = uploadFileType === 30 ? '商品效果图' : 'BOM 效果图';
    const extension = getMagicUploadFileExtension(file.name || entry.name);
    if (!/\.(?:jpe?g|png|bmp)$/i.test(extension)) throw new Error('效果图仅支持 JPG / PNG / BMP：' + (entry.name || file.name));
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u83b7\u53d6' + routeLabel + ' OSS \u6388\u6743 ' + index + '/' + total);
    const secretPayload = await fetchPlmApiJson('/api/Common/GetOssClientSecretKey', { upload_file_type: uploadFileType });
    const secret = secretPayload && secretPayload.data;
    if (!secret || !secret.bucket || !secret.file_directory) throw new Error('未获取到效果图 OSS 临时授权');
    const uploadMaxBytes = Number(secret.max_file_size) || (20 * 1024 * 1024);
    if (file.size > uploadMaxBytes) throw new Error('效果图超过 PLM 限制：' + Math.round(uploadMaxBytes / 1024 / 1024) + 'MB');
    const Oss = getLazyExternalRuntime('oss') || await ensureLazyExternalScript('oss').catch(() => null);
    if (typeof Oss !== 'function') throw new Error('OSS 上传组件未加载，请刷新脚本');
    const objectName = String(secret.file_directory).replace(/^\/+/, '') + '/' + createMagicObjectName(extension);
    const client = new Oss({ region: 'oss-cn-shenzhen', bucket: secret.bucket, accessKeyId: secret.access_key_id, accessKeySecret: secret.access_key_secret, stsToken: secret.security_token, endpoint: 'https://oss-cn-shenzhen.aliyuncs.com', secure: true, retryMax: OSS_UPLOAD_SDK_RETRY_MAX, timeout: OSS_UPLOAD_TIMEOUT_MS });
    await multipartUploadWithRetry(client, objectName, file, {
      partSize: 2 * 1024 * 1024,
      parallel: 2,
      progress: (percent) => updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u6548\u679c\u56fe ' + index + '/' + total + ' · ' + Math.round(Math.min(1, Math.max(0, Number(percent) || 0)) * 100) + '%'),
    }, (error, retryCount, delay, checkpoint) => {
      const completedParts = checkpoint && Array.isArray(checkpoint.doneParts) ? checkpoint.doneParts.length : 0;
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u7f51\u7edc\u6ce2\u52a8\uff0c\u81ea\u52a8\u91cd\u8bd5 ' + retryCount + '/' + OSS_UPLOAD_RETRY_MAX + ' · \u5df2\u5b8c\u6210\u5206\u7247 ' + completedParts + ' · ' + Math.round(delay / 1000) + '\u79d2\u540e\u7ee7\u7eed');
    });
    await fetchPlmApiJson('/api/Common/SaveUploadFileInfo', { upload_file_type: uploadFileType, oss_path: objectName, original_file_name: file.name || entry.name });
    return objectName;
  }

  async function runToyEffectQueueItem(item) {
    if (!hasApiUploadAccess()) throw new Error('当前账号没有后台上传权限，效果图后台队列已停止');
    const entries = getToyEffectUploadEntries(item);
    if (!item || !item.sku || !entries.length) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u73a9\u5177\u6548\u679c\u56fe\u6587\u4ef6');
      return;
    }
    const cached = normalizeData(loadData(item.sku) || (state.index || []).find((entry) => entry.sku === item.sku) || { sku: item.sku });
    const manualProductRoute = isManualSkuProductEffectRoute(cached);
    const productRoute = manualProductRoute || !/^\d+$/.test(getToyEffectProjectId(cached));
    const manualPacking = manualProductRoute ? normalizeManualToyEffectPacking(state.manualToyEffectPacking) : null;
    if (manualProductRoute && !hasManualToyEffectPacking(manualPacking)) {
      const message = '请先点击“手动设置装箱数/总重”填写装箱数和总重，再处理手动产品效果图';
      markUploadQueueBlocked(item, L.uploadFailed, message);
      showToast(item.sku + ' ' + message);
      return;
    }
    let productContext = null;
    let data = cached;
    if (productRoute) {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u624b\u52a8 SKU \u6b63\u5728\u8bfb\u53d6\u5546\u54c1\u7248\u672c');
      productContext = await resolveMagicUploadProductContext(item);
      data = normalizeData({ ...data, productId: productContext.productId, productVersionId: productContext.productVersionId });
    } else {
      data = await resolveToyEffectProjectData(item);
    }
    const files = [];
    for (const entry of entries) {
      const file = await getUploadFile(entry.key);
      if (!file) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u73a9\u5177\u6548\u679c\u56fe\uff1a' + entry.name);
        return;
      }
      files.push({ entry, file });
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', productRoute ? '\u6309 HAR \u65b9\u5f0f\u4e0a\u4f20\u5546\u54c1\u6548\u679c\u56fe' : '\u901a\u8fc7\u540e\u53f0\u670d\u52a1\u4e0a\u4f20 BOM \u6548\u679c\u56fe', { effectUploadRoute: productRoute ? 'product-draft' : 'project-bom' });
    state.selectedSku = data.sku;
    state.sku = data.sku;
    state.data = data;
    const uploadedPaths = [];
    for (let index = 0; index < files.length; index += 1) {
      const current = files[index];
      uploadedPaths.push(await uploadToyEffectFileByApi(item, data, current.entry, current.file, index + 1, files.length, { uploadFileType: productRoute ? 30 : 40 }));
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', productRoute ? '\u4fdd\u5b58\u5546\u54c1\u8349\u7a3f\u5e76\u63d0\u5ba1' : '\u4fdd\u5b58 BOM \u6548\u679c\u56fe');
    const saveResult = productRoute
      ? await saveToyEffectPicturesToProductByApi(item, data, uploadedPaths, productContext, manualProductRoute ? manualPacking : null)
      : await saveToyEffectPicturesByApi(data, uploadedPaths);
    const replacedCount = Number(saveResult && saveResult.replacedCount) || 0;
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', replacedCount ? '\u5df2\u66ff\u6362 ' + replacedCount + ' \u5f20\u65e7\u6548\u679c\u56fe' : '\u6548\u679c\u56fe\u5df2\u4fdd\u5b58', { effectReplacedCount: replacedCount });
    archiveUploadItem(item);
    addLog('success', '\u73a9\u5177\u6548\u679c\u56fe\u4e0a\u4f20\u6210\u529f', data.sku + ' | ' + (productRoute ? '\u5546\u54c1\u8349\u7a3f' : 'BOM') + ' | ' + uploadedPaths.length + ' 张');
    showToast(data.sku + (replacedCount ? ' \u5df2\u66ff\u6362\u65e7\u6548\u679c\u56fe\u5e76\u63d0\u5ba1\u6210\u529f' : ' \u6548\u679c\u56fe\u4e0a\u4f20\u5e76\u63d0\u5ba1\u6210\u529f'));
  }

  async function runCopyrightUploadQueueItem(item) {
    addLog('info', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const entries = getCopyrightUploadEntries(item);
    const files = [];
    for (const entry of entries) {
      const file = await getUploadFile(entry.key);
      if (!file) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u7248\u6743\u56fe\u6587\u4ef6\uff1a' + entry.name);
        return;
      }
      files.push({ entry, file });
    }
    if (!files.length) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u7248\u6743\u56fe\u6587\u4ef6');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1', { resumeUploadAfterRefresh: false });
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      throwIfUploadRetryNoticeVisible();
      for (let index = 0; index < files.length; index += 1) {
        const current = files[index];
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u7248\u6743\u56fe ' + (index + 1) + '/' + files.length);
        await uploadFileToProductField('\u7248\u6743\u56fe', current.file, current.entry.name || current.file.name);
        throwIfUploadRetryNoticeVisible();
      }
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f');
      const draftSaved = await saveProductDraftBeforeClose();
      if (!draftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' \u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f');
    } catch (error) {
      addLog('error', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + formatErrorMessage(error));
      throw error;
    }
  }

  async function runUploadQueueItem(item) {
    if (item && item.kind === 'toy-label') {
      await runToyLabelQueueItem(item);
      return;
    }
    if (item && item.kind === 'toy-effect') {
      await runToyEffectQueueItem(item);
      return;
    }
    if (item && item.kind === 'copyright') {
      await runCopyrightUploadQueueItem(item);
      return;
    }
    addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const xlsx = await getUploadFile(item.xlsxKey);
    const zip = await getUploadFile(item.zipKey);
    if (!xlsx || !zip) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u6587\u4ef6');
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u7f3a\u5c11\u6587\u4ef6', item && item.sku ? item.sku : '');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1', { resumeUploadAfterRefresh: false });
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u68c0\u67e5\u65e7\u5185\u5bb9');
      const existingSummary = getProductReplaceUploadSummary(item.sku);
      if (existingSummary.total && !item.forceReplace) {
        markUploadQueueBlocked(item, L.uploadExistingContent, '\u65e7\u5185\u5bb9\uff1a' + existingSummary.parts.join(' / '), { existingContent: existingSummary.parts.join(' / ') });
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u5df2\u6709\u5185\u5bb9', item.sku + ' ' + existingSummary.parts.join(' / '));
        showToast(item.sku + ' ' + L.uploadExistingContent + '\uff0c\u5df2\u8df3\u8fc7\uff1b\u52fe\u9009\u91cd\u8bd5\u624d\u4f1a\u6e05\u7406\u540e\u91cd\u4f20');
        try {
          await closeTopProductDrawer({ skipDraftSave: true });
        } catch (closeError) {
          state.uploadRunning = false;
          saveUploadWorkerRunning(getUploadControlMode(), false);
          addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + formatErrorMessage(closeError));
          showToast(item.sku + ' \u5df2\u6709\u5185\u5bb9\uff0c\u4f46\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25\uff0c\u961f\u5217\u5df2\u6682\u505c');
        }
        return;
      }
      if (item.forceReplace) {
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6e05\u7406\u65e7\u6587\u4ef6');
        await clearProductReplaceUploadFiles(item.sku);
      }
      if (item.forceReplace) updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u51c6\u5907\u4e0a\u4f20', { forceReplace: false });
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599');
      await uploadFileToProductField('\u63a8\u54c1\u8d44\u6599', xlsx, item.xlsxName || xlsx.name);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u56fe\u5305\u7d20\u6750');
      await uploadFileToProductField('\u56fe\u5305\u7d20\u6750', zip, item.zipName || zip.name);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6279\u91cf\u4e0a\u4f20');
      await openBatchUploadDialog();
      await uploadBatchZip(zip, item.zipName || zip.name);
      await matchBatchUploadForm();
      await confirmBatchUpload();
      await verifyBatchImagesUploaded(item.sku);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u8bfb\u53d6\u5e76\u586b\u5199\u88c5\u7bb1\u6570\u548c\u7bb1\u91cd');
      const packingSummary = await fillBatchUploadPackingFields(item, xlsx);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f', { excelPacking: packingSummary.source });
      const preReviewDraftSaved = await saveProductDraftBeforeClose();
      if (!preReviewDraftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' ' + L.uploadSuccess);
    } catch (error) {
      console.warn('PLM floating helper upload queue failed:', error);
      if (isUploadRetryRefreshError(error) || findUploadRetryNotice()) {
        await refreshPageAndRetryUploadItem(item);
        return;
      }
      if (isReviewConfirmWaitError(error)) {
        pauseUploadAfterReviewConfirmTimeout(item, error);
        return;
      }
      if (error && /产品信息开品中|不能编辑/.test(error.message || '')) {
        markUploadQueueBlocked(item, '\u5df2\u8df3\u8fc7', '\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d', item.sku);
        showToast(item.sku + ' \u5df2\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u4ea7\u54c1\u5df2\u505c\u7528|\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u4ea7\u54c1\u5df2\u505c\u7528');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u4ea7\u54c1\u5df2\u505c\u7528', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u4ea7\u54c1\u5df2\u505c\u7528');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        await closeTopProductDrawer({ skipDraftSave: true });
        return;
      }
      const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
      markUploadQueueBlocked(item, L.uploadFailed, message);
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + message);
      showToast(item.sku + ' ' + L.uploadFailed + '\uff1a' + message);
      try {
        await closeTopProductDrawer();
      } catch (closeError) {
        console.warn('PLM floating helper close after upload failure failed:', closeError);
        state.uploadRunning = false;
        saveUploadWorkerRunning(getUploadControlMode(), false);
        markUploadQueueBlocked(item, L.uploadFailed, message + '\uff1b\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + (closeError && closeError.message ? closeError.message : '\u672a\u77e5\u9519\u8bef'));
        showToast('\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c\uff0c\u8bf7\u624b\u52a8\u5904\u7406\u5f39\u7a97');
        throw closeError;
      }
    }
  }

  async function ensureUploadPageReadyForNextItem() {
    try {
      assertNoReviewConfirmModal();
      if (getVisibleModal() || getOpenProductDrawer()) await closeTopProductDrawer({ skipDraftSave: true });
      const bomDrawer = getProjectBomDrawerForSku('');
      if (bomDrawer) await closeProjectBomDrawer(bomDrawer);
      await waitForUploadPageIdle();
    } catch (error) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(getUploadControlMode(), false);
      throw error;
    }
  }

  async function waitForUploadPageIdle() {
    const startedAt = Date.now();
    let idleSince = 0;
    while (Date.now() - startedAt < UPLOAD_PAGE_IDLE_TIMEOUT_MS) {
      const modal = getVisibleModal();
      if (modal) {
        idleSince = 0;
        if (isReviewConfirmModal(modal)) {
          throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u6682\u505c\u4e0a\u4f20\u961f\u5217');
        }
        if (isCancelConfigModal(modal)) {
          confirmCancelConfigModal(modal);
          await wait(120);
          continue;
        }
        await wait(120);
        continue;
      }
      if (getOpenProductDrawer()) {
        idleSince = 0;
        await wait(120);
        continue;
      }
      if (!idleSince) idleSince = Date.now();
      if (Date.now() - idleSince >= UPLOAD_PAGE_IDLE_STABLE_MS) return true;
      await wait(120);
    }
    throw new Error('\u7b49\u5f85\u5546\u54c1\u9875\u548c\u5f39\u7a97\u5b8c\u5168\u5173\u95ed\u8d85\u65f6\uff0c\u5df2\u6682\u505c\u4e0a\u4f20\u961f\u5217');
  }

  async function recoverPurchaseEmptyRunningUpload(mode) {
    if (!findPurchaseInfoEmptyError()) return false;
    const queue = loadUploadQueue();
    const running = getCurrentRunningUpload(queue, mode || getUploadControlMode());
    if (!running) return false;
    markUploadQueueBlocked(running, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', running.sku || '');
    await closeTopProductDrawer({ skipDraftSave: true });
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    showToast(running.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    return true;
  }

  async function ensureProductManagementPage() {
    if (!/\/productManagementProduct/.test(location.pathname)) {
      location.href = location.origin + '/productManagementProduct?plmUploadWorker=1&plmUploadMode=' + encodeURIComponent(getUploadControlMode());
      await waitUntil(() => /\/productManagementProduct/.test(location.pathname), 15000, 300);
    }
    await waitUntil(() => document.body && document.body.innerText.includes('\u5546\u54c1\u7ba1\u7406'), 20000, 300);
  }

  function isToyCopywritingProductManagementPageReady() {
    return /\/productManagementProduct/.test(location.pathname)
      && Boolean(findProductSearchInput() && findVisibleButton('\u67e5\u8be2'));
  }

  function findToyCopywritingProductManagementMenuLeaf() {
    const expected = compactText('\u5546\u54c1\u7ba1\u7406');
    const candidates = Array.from(document.querySelectorAll('[data-menu-id], .ant-menu-item, [role="menuitem"]')).filter(isVisibleElement);
    return candidates.find((el) => (el.getAttribute('data-menu-id') || '') === '/productManagementProduct')
      || candidates.find((el) => !el.matches('.ant-menu-submenu-title') && compactText(el.innerText || el.textContent) === expected)
      || null;
  }

  async function ensureProductManagementPageInPlace() {
    if (isToyCopywritingProductManagementPageReady()) return true;
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6587\u6848\uff1a\u7ad9\u5185\u5207\u6362\u5230\u5546\u54c1\u7ba1\u7406');
    const tabButton = findTopTabByText('\u5546\u54c1\u7ba1\u7406');
    if (tabButton) {
      clickElement(tabButton);
      const readyFromTab = await waitFor(() => isToyCopywritingProductManagementPageReady(), 8000, 150);
      if (readyFromTab) return true;
    }
    let menuItem = findToyCopywritingProductManagementMenuLeaf();
    if (!menuItem) {
      const menuRoot = Array.from(document.querySelectorAll('.ant-menu-submenu-title'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === compactText('\u5546\u54c1\u7ba1\u7406')) || null;
      if (menuRoot) {
        clickElement(menuRoot);
        menuItem = await waitFor(() => findToyCopywritingProductManagementMenuLeaf(), 2000, 100);
      }
    }
    if (menuItem) {
      clickElement(menuItem);
      const readyFromMenu = await waitFor(() => isToyCopywritingProductManagementPageReady(), 10000, 150);
      if (readyFromMenu) return true;
    }
    addLog('error', '\u6279\u91cf\u73a9\u5177\u6587\u6848\uff1a\u672a\u80fd\u65e0\u5237\u65b0\u5207\u6362\u5230\u5546\u54c1\u7ba1\u7406');
    throw new Error('\u672a\u80fd\u65e0\u5237\u65b0\u5207\u6362\u5230\u5546\u54c1\u7ba1\u7406');
  }

  async function searchProductManagementSku(sku) {
    const input = findProductSearchInput();
    if (!input) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u641c\u7d22\u6846');
    setNativeInputValue(input, sku);
    const button = findVisibleButton('\u67e5\u8be2');
    if (!button) throw new Error('\u672a\u627e\u5230\u67e5\u8be2\u6309\u94ae');
    button.click();
    await waitUntil(() => findProductRowIdBySku(sku), 20000, 500);
  }

  function findProductSearchInput() {
    const roots = Array.from(document.querySelectorAll('.searchForm, .queryForm, .ant-form, .vxe-toolbar, .el-form, form, body')).filter(isVisibleElement);
    const inputs = Array.from(new Set(roots.flatMap((root) => Array.from(root.querySelectorAll('input')).filter(isVisibleElement))));
    const byPlaceholder = (patterns) => inputs.find((input) => {
      const text = compactText(input.getAttribute('placeholder') || input.placeholder || '');
      return patterns.some((pattern) => pattern.test(text));
    }) || null;
    const exactProductCode = byPlaceholder([/^\s*商品编码(?:\/|$|[\s，,、])/i, /^\s*商品编码/i]);
    if (exactProductCode) return exactProductCode;
    const labelMatched = inputs.find((input) => {
      const item = input.closest('.ant-form-item, .el-form-item, .vxe-form--item, .form-item, div');
      const text = compactText((item && (item.innerText || item.textContent)) || '');
      return /商品编码/.test(text) && !/商品名称|产品名称/.test(text.replace(/商品编码/g, ''));
    });
    if (labelMatched) return labelMatched;
    return byPlaceholder([/SKU/i]) || null;
  }

  function findProductRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid], .ant-table-row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  async function openProductEditDrawer(sku) {
    if (getProductEditDrawerForSku(sku)) return;
    const rowId = findProductRowIdBySku(sku);
    if (!rowId) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u884c');
    const row = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((el) => Array.from(el.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u7f16\u8f91'));
    const button = row && Array.from(row.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u7f16\u8f91');
    if (!button) throw new Error('\u672a\u627e\u5230\u7f16\u8f91\u6309\u94ae');
    if (button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|\bis-disabled\b|ant-btn-disabled/.test(button.className || '')) {
      throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
    }
    button.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 20000) {
      const drawer = getProductEditDrawerForSku(sku);
      if (drawer) return;
      if (getVisibleText(document.body).includes('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91')) {
        throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
      }
      await wait(300);
    }
    throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
  }

  function getProductEditDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        const headerSku = getProjectDrawerHeaderSku(drawer);
        return /(?:\u7f16\u8f91\u5546\u54c1|\u8bbe\u8ba1\u8d44\u6599)/.test(text)
          && (!sku || headerSku === String(sku).toUpperCase() || text.includes(sku));
      }) || null;
  }

  async function enterProductEditSecondStep(sku) {
    const drawer = getProductEditDrawerForSku(sku);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    if (getVisibleText(drawer).includes('\u63a8\u54c1\u8d44\u6599')) return;
    const ready = await waitFor(() => {
      const readyDrawer = getProductEditDrawerForSku(sku);
      if (!readyDrawer || !isProductCategoryReady(readyDrawer)) return null;
      const button = Array.from(readyDrawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === '\u4e0b\u4e00\u6b65' && isActionButtonReady(el));
      return button ? { drawer: readyDrawer, button } : null;
    }, 20000, 100);
    if (!ready) throw new Error('\u7c7b\u76ee\u672a\u52a0\u8f7d\u5b8c\u6210\u6216\u672a\u627e\u5230\u53ef\u70b9\u51fb\u7684\u300c\u4e0b\u4e00\u6b65\u300d');
    clickElement(ready.button);
    await waitUntil(() => {
      const nextDrawer = getProductEditDrawerForSku(sku);
      return nextDrawer && getVisibleText(nextDrawer).includes('\u63a8\u54c1\u8d44\u6599');
    }, 30000, 500);
  }

  function isProductCategoryReady(drawer) {
    if (!drawer) return false;
    const item = getScopedProductFormItem(drawer, '\u7c7b\u76ee');
    if (!item) return false;
    const text = compactText(item.innerText || item.textContent);
    const value = text.replace(/^\u7c7b\u76ee[*\uff1a:\s]*/, '').trim();
    const html = item.innerHTML || '';
    if (!value || /\u8bf7\u9009\u62e9|--/.test(value)) return false;
    if (/\u52a0\u8f7d|loading|ant-spin|ant-select-loading/.test(text + html)) return false;
    return true;
  }

  function getScopedProductFormItem(scope, labelText) {
    const labels = Array.from(scope.querySelectorAll('.ant-form-item-label label'));
    const normalizeLabel = (el) => compactText(el.innerText || el.textContent).replace(/[*\uff1a:]/g, '').trim();
    const label = labels.find((el) => normalizeLabel(el) === labelText) ||
      labels.find((el) => {
        const text = normalizeLabel(el);
        return text === labelText || text.startsWith(labelText + ' ') || text.startsWith(labelText + '\u3000');
      });
    if (label) return label.closest('.ant-form-item');
    if (labelText === '\u7248\u6743\u56fe') {
      const stableField = scope.querySelector('[id="351"], input[id*="attr_group_408_0_attr_language_config_json_0_value"]');
      return stableField ? stableField.closest('.ant-form-item') : null;
    }
    return null;
  }

  async function uploadFileToProductField(labelText, file, filename) {
    const item = getProductFormItem(labelText);
    if (!item) throw new Error('\u672a\u627e\u5230' + labelText);
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    await putFileIntoUploadItem(item, file, filename);
    await waitUploadItemDone(item, filename, 180000);
  }

  async function clearProductReplaceUploadFiles(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    let removedCount = 0;
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      item.scrollIntoView({ block: 'center', inline: 'nearest' });
      await wait(180);
      removedCount += await clearUploadFilesInFormItem(item, labelText);
    }
    if (removedCount) await wait(500);
  }

  function getProductReplaceUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function verifyBatchImagesUploaded(sku) {
    await waitUntil(() => {
      const summary = getBatchImageUploadSummary(sku);
      return summary.total > 0 ? summary : null;
    }, 30000, 500).catch(() => null);
    const summary = getBatchImageUploadSummary(sku);
    if (summary.total <= 0) {
      throw new Error('\u6279\u91cf\u4e0a\u4f20\u540e\u672a\u68c0\u6d4b\u5230\u4e3b\u56fe/\u8be6\u60c5\u56fe/SKU\u56fe');
    }
  }

  function getBatchImageUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_BATCH_IMAGE_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function clearUploadFilesInFormItem(item, labelText) {
    let removed = 0;
    for (let round = 0; round < 12; round += 1) {
      const fileNodes = getExistingUploadFileNodes(item);
      if (!fileNodes.length) break;
      const before = fileNodes.length;
      const fileNode = fileNodes[0];
      const deleteTarget = findUploadDeleteTarget(fileNode);
      if (!deleteTarget) {
        throw new Error(labelText + '\u65e7\u6587\u4ef6\u65e0\u6cd5\u5220\u9664');
      }
      revealUploadActions(fileNode);
      await wait(80);
      clickElement(deleteTarget);
      await confirmUploadDeleteIfNeeded();
      await waitUntil(() => getExistingUploadFileNodes(item).length < before, 10000, 250);
      removed += 1;
    }
    if (getExistingUploadFileNodes(item).length) {
      throw new Error(labelText + '\u65e7\u6587\u4ef6\u672a\u6e05\u7a7a');
    }
    return removed;
  }

  function getExistingUploadFileNodes(item) {
    return Array.from(item.querySelectorAll('.filePreviewCard, .ant-upload-list-item, .ant-upload-list-picture-card-container, .ant-upload-list-text-container'))
      .filter(isVisibleElement)
      .filter((node) => !/ant-upload-list-item-uploading/.test(node.className || ''))
      .filter((node) => {
        const text = getVisibleText(node);
        const html = node.innerHTML || '';
        return /filePreviewCard|ant-upload-list-item|ant-upload-list-picture-card-container|ant-upload-list-text-container/.test(node.className || '') &&
          (/\u9884\u89c8|anticon-delete|delBtnIcon|ant-upload-list-item-name|ant-upload-list-item-card-actions/.test(text + html));
      });
  }

  function revealUploadActions(node) {
    if (!node) return;
    node.classList.add('pfh-force-upload-actions');
    node.querySelectorAll('.downloadBtn').forEach((el) => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
    ['mouseenter', 'mouseover', 'mousemove'].forEach((type) => {
      dispatchDomEvent(node, type);
    });
  }

  function findUploadDeleteTarget(node) {
    const selectors = [
      '.delBtnIcon',
      '.anticon-delete.delBtnIcon',
      '.ant-upload-list-item-actions .anticon-delete',
      '.ant-upload-list-item-actions [aria-label*="delete" i]',
      '.ant-upload-list-item-actions [aria-label*="\u5220\u9664"]',
      '.ant-upload-list-item-actions [title*="\u5220\u9664"]',
      '.ant-upload-list-item-actions button',
      '.ant-upload-list-item-card-actions .anticon-delete',
      '.anticon-delete',
      '[aria-label*="delete" i]',
      '[aria-label*="\u5220\u9664"]',
      '[title*="\u5220\u9664"]',
    ];
    for (const selector of selectors) {
      const target = node.querySelector(selector);
      if (target) return getClickableElement(target);
    }
    const candidates = Array.from(node.querySelectorAll('button, span, i, svg, a')).filter((el) => {
      const text = compactText(el.innerText || el.textContent || '');
      const meta = [el.className || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || ''].join(' ');
      return /\u5220\u9664|delete|remove|trash|close/i.test(text + ' ' + meta);
    });
    return candidates.length ? getClickableElement(candidates[0]) : null;
  }

  function getClickableElement(el) {
    return el && (el.closest('button, a, [role="button"], .downloadBtn, .ant-upload-list-item-card-actions-btn, .anticon-delete') || el);
  }

  function clickElement(el) {
    if (!el) return;
    if (typeof el.click === 'function') {
      el.click();
      return;
    }
    dispatchDomEvent(el, 'click');
  }

  function dispatchDomEvent(el, type) {
    if (!el) return false;
    try {
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      return true;
    } catch (error) {
      if (type === 'click' && typeof el.click === 'function') {
        el.click();
        return true;
      }
      console.warn('PLM floating helper dispatch event failed:', type, error);
      return false;
    }
  }

  async function confirmUploadDeleteIfNeeded() {
    await wait(250);
    const popup = Array.from(document.querySelectorAll('.ant-popover, .ant-modal'))
      .filter(isVisibleElement)
      .reverse()
      .find((el) => /\u5220\u9664|\u786e\u5b9a|\u786e\u8ba4/.test(getVisibleText(el)));
    if (!popup) return;
    const button = Array.from(popup.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => /\u786e\u5b9a|\u786e\u8ba4|OK/i.test(compactText(el.innerText || el.textContent)));
    if (button) {
      button.click();
      await wait(250);
    }
  }

  function getProductFormItem(labelText) {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, labelText);
  }

  function getBatchUploadPackingInput(field) {
    const item = getProductFormItem(field.attrName);
    if (!item) return null;
    const input = Array.from(item.querySelectorAll('input'))
      .find((element) => element && element.type !== 'hidden');
    return input ? { item, input } : null;
  }

  async function fillBatchUploadPackingFields(task, xlsx) {
    const controls = MAGIC_UPLOAD_PACKING_FIELDS.map((field) => ({ field, control: getBatchUploadPackingInput(field) }));
    const missingControls = controls.filter((entry) => !entry.control).map((entry) => entry.field.attrName + '字段');
    if (missingControls.length) {
      throw new Error('PLM 未找到' + missingControls.join('、') + '输入框，已停止保存草稿和提审');
    }

    const current = controls.reduce((result, entry) => {
      const value = entry.control.input.value;
      result[entry.field.key] = entry.field.key === 'standardPackingQuantity'
        ? normalizeMagicUploadPackingQuantity(value)
        : normalizeMagicUploadBoxWeight(value);
      return result;
    }, { standardPackingQuantity: '', boxWeight: '' });
    const needsSource = MAGIC_UPLOAD_PACKING_FIELDS.some((field) => !current[field.key]);
    let source = normalizeMagicUploadExcelPacking(task && task.excelPacking);
    let parsedMeta = null;
    if (needsSource) {
      parsedMeta = await readMagicUploadPackingFromFile(xlsx, task && task.sku, source);
      source = normalizeMagicUploadExcelPacking(parsedMeta);
      if (parsedMeta.formulaResultUsed || parsedMeta.formulaFallbackUsed) {
        addLog('info', parsedMeta.formulaFallbackUsed ? '批量提审按 Excel 公式计算箱重' : '批量提审读取 Excel 箱重缓存值', task.sku + ' | ' + parsedMeta.sourceName + ' | 不使用公式文本');
      }
    }

    const changed = [];
    const retained = [];
    const missing = [];
    controls.forEach((entry) => {
      const { field, control } = entry;
      const input = control.input;
      const existing = field.key === 'standardPackingQuantity'
        ? normalizeMagicUploadPackingQuantity(input.value)
        : normalizeMagicUploadBoxWeight(input.value);
      if (existing) {
        retained.push(field.attrName + '=' + existing);
        return;
      }
      if (input.disabled || input.readOnly) {
        missing.push(field.attrName + '输入框不可编辑');
        return;
      }
      if (!source[field.key]) {
        missing.push(field.attrName);
        return;
      }
      control.item.scrollIntoView({ block: 'center', inline: 'nearest' });
      setNativeInputValue(input, source[field.key]);
      changed.push(field.attrName + '=' + source[field.key] + '(Excel)');
    });
    if (missing.length) {
      throw new Error('PLM 缺少' + missing.join('、') + '，Excel 未提供有效值，已停止保存草稿和提审');
    }

    if (changed.length) await wait(180);
    const notAccepted = controls.filter((entry) => changed.some((value) => value.indexOf(entry.field.attrName + '=') === 0))
      .filter((entry) => {
        const actual = entry.field.key === 'standardPackingQuantity'
          ? normalizeMagicUploadPackingQuantity(entry.control.input.value)
          : normalizeMagicUploadBoxWeight(entry.control.input.value);
        return actual !== source[entry.field.key];
      })
      .map((entry) => entry.field.attrName);
    if (notAccepted.length) {
      throw new Error('PLM 未接受' + notAccepted.join('、') + '填写值，已停止保存草稿和提审');
    }
    return { changed, retained, source };
  }

  async function putFileIntoUploadItem(item, file, filename) {
    const input = item.querySelector('input[type="file"]');
    if (!input) throw new Error('\u672a\u627e\u5230\u4e0a\u4f20\u63a7\u4ef6');
    const mime = (file && file.type && /^image\//.test(file.type)) ? file.type : guessMime(filename);
    const uploadFile = file instanceof File ? file : new File([file], filename, { type: mime });
    const namedFile = uploadFile.name === filename && uploadFile.type ? uploadFile : new File([uploadFile], filename, { type: uploadFile.type || mime, lastModified: uploadFile.lastModified || Date.now() });
    const dt = new DataTransfer();
    dt.items.add(namedFile);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitUploadItemDone(item, filename, timeout) {
    const base = String(filename || '').replace(/^.*[\\\/]/, '');
    let failureSeenAt = 0;
    await waitUntil(() => {
      const html = item.innerHTML || '';
      const text = getVisibleText(item);
      throwIfUploadRetryNoticeVisible();
      if (/\u4e0a\u4f20\u5931\u8d25|ant-upload-list-item-error/.test(html + text)) {
        if (!failureSeenAt) failureSeenAt = Date.now();
        if (Date.now() - failureSeenAt < 1800) return false;
        throw new Error('\u4e0a\u4f20\u5931\u8d25');
      }
      return !/ant-progress|uploading|\u4e0a\u4f20\u4e2d/.test(html + text) && (text.includes('\u9884\u89c8') || text.includes(base) || /ant-upload-list-item-done/.test(html));
    }, timeout || 120000, 800);
  }

  async function openBatchUploadDialog() {
    await closeCancelConfigModalIfPresent();
    let button = findBatchUploadEntryButton();
    for (let attempt = 0; !button && attempt < 4; attempt += 1) {
      await wait(300);
      await closeCancelConfigModalIfPresent();
      button = findBatchUploadEntryButton();
    }
    if (!button) throw new Error('\u672a\u627e\u5230\u6279\u91cf\u4e0a\u4f20\u5165\u53e3');
    await wait(120);
    await closeCancelConfigModalIfPresent();
    button = findBatchUploadEntryButton();
    if (!button) {
      await wait(300);
      await closeCancelConfigModalIfPresent();
      button = findBatchUploadEntryButton();
    }
    if (!button) throw new Error('\u6279\u91cf\u4e0a\u4f20\u5165\u53e3\u88ab\u5f39\u7a97\u5360\u7528');
    button.click();
    await waitUntil(() => getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u6587\u4ef6') && getVisibleModal(), 30000, 500);
  }

  function findBatchUploadEntryButton() {
    const bottomRightFloat = Array.from(document.querySelectorAll('.ant-float-btn'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.right > window.innerWidth - 80 && rect.bottom > window.innerHeight - 80)
      .find(({ el, rect }) => isElementTopmostAtCenter(el, rect));
    if (bottomRightFloat) return bottomRightFloat.el;

    const candidates = Array.from(document.querySelectorAll('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.left > window.innerWidth - 180 && rect.top > window.innerHeight - 180);
    return candidates.find(({ el, rect }) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const top = document.elementFromPoint(x, y);
      return top && (top === el || el.contains(top) || top.closest('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right') === el || top.closest('.ant-float-btn'));
    })?.el || null;
  }

  function isElementTopmostAtCenter(el, rect) {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (top === el || el.contains(top) || top.closest('.ant-float-btn') === el));
  }

  async function uploadBatchZip(file, filename) {
    const modal = getVisibleModal();
    if (!modal) throw new Error('\u672a\u6253\u5f00\u6279\u91cf\u4e0a\u4f20\u7a97\u53e3');
    await putFileIntoUploadItem(modal, file, filename);
    await waitUploadItemDone(modal, filename, 180000);
  }

  async function matchBatchUploadForm() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u5339\u914d\u8868\u5355');
    if (!button) throw new Error('\u672a\u627e\u5230\u5339\u914d\u8868\u5355');
    button.click();
    await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (isBatchUploadMappingErrorText(text)) throw new Error('\u56fe\u5305ZIP\u5185\u90e8\u6587\u4ef6\u5206\u7ec4\u4e0d\u6b63\u786e');
      return text.includes('\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    }, 30000, 200);
  }

  function isBatchUploadMappingErrorText(text) {
    return /\u672a\u5728\u8868\u5355\u4e2d\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u672a\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u8868\u5355.*\u5339\u914d.*\u5c5e\u6027/.test(String(text || ''));
  }

  async function confirmBatchUpload() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    if (!button) throw new Error('\u672a\u627e\u5230\u5f00\u59cb\u4e0a\u4f20');
    button.click();
    await waitUntil(() => !getVisibleModal() || getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u5b8c\u6210'), 240000, 1000);
    await wait(1500);
  }

  function isReviewConfirmWaitError(error) {
    return Boolean(error && error.code === 'PFH_REVIEW_CONFIRM_TIMEOUT');
  }

  function pauseUploadAfterReviewConfirmTimeout(item, error) {
    const message = error && error.message ? error.message : '\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u7b49\u5f85\u8d85\u65f6';
    reviewConfirmRequestedAt = 0;
    state.uploadRunning = false;
    saveUploadWorkerRunning(getUploadControlMode(), false);
    markUploadQueueBlocked(item, L.uploadFailed, message + '\uff0c\u5df2\u6682\u505c\uff0c\u8bf7\u624b\u52a8\u5904\u7406\u63d0\u5ba1\u5f39\u7a97');
    addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u63d0\u5ba1\u5f39\u7a97\u54cd\u5e94\u8d85\u65f6\uff0c\u5df2\u6682\u505c', item && item.sku ? item.sku : '');
    showToast((item && item.sku ? item.sku + ' ' : '') + '\u63d0\u5ba1\u5f39\u7a97\u54cd\u5e94\u8f83\u6162\uff0c\u5df2\u6682\u505c\u961f\u5217\uff0c\u8bf7\u624b\u52a8\u5904\u7406');
  }

  async function submitProductReview() {
    const reviewResult = await clickReviewAndWaitConfirm();
    if (reviewResult === 'disabled') {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    }
    if (reviewResult === 'purchase-empty') {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    if (reviewResult === 'minimum-order') {
      reviewConfirmRequestedAt = 0;
      const filled = await fillMinimumOrderQuantityIfNeeded();
      if (!filled) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
      const retryResult = await clickReviewAndWaitConfirm();
      if (retryResult === 'disabled') {
        reviewConfirmRequestedAt = 0;
        throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
      }
      if (retryResult === 'purchase-empty') {
        reviewConfirmRequestedAt = 0;
        throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
      }
      if (retryResult !== 'confirm') throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    }
    if (findProductDisabledError()) {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    }
    if (findPurchaseInfoEmptyError()) {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    if (!getVisibleModal()) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    const confirm = await waitUntil(() => findReviewConfirmButton(), 30000, 200);
    if (!confirm) throw new Error('\u672a\u627e\u5230\u786e\u8ba4\u63d0\u5ba1');
    confirm.click();
    reviewConfirmRequestedAt = 0;
    const result = await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (text.includes('\u4ea7\u54c1\u63d0\u5ba1\u6210\u529f') || text.includes('\u63d0\u5ba1\u6210\u529f')) {
        return isReviewConfirmModal(getVisibleModal()) ? '' : 'success';
      }
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      return '';
    }, 120000, 200);
    if (result === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (result === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
  }

  function findReviewConfirmButton() {
    const modal = getVisibleModal();
    if (!modal) return null;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => {
      const text = compactText(el.innerText || el.textContent).replace(/\s+/g, '');
      const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(el.className || '');
      return text === '\u63d0\u5ba1' && !disabled;
    }) || null;
  }

  async function clickReviewAndWaitConfirm() {
    const button = await waitUntil(() => findProductReviewButton(), 60000, 800);
    if (!button) throw new Error('\u672a\u627e\u5230\u63d0\u5ba1\u6309\u94ae');
    button.click();
    reviewConfirmRequestedAt = Date.now();
    const startedAt = Date.now();
    while (Date.now() - startedAt < REVIEW_CONFIRM_WAIT_MS) {
      const modal = getVisibleModal();
      if (isReviewConfirmModal(modal)) return 'confirm';
      if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      await wait(80);
    }
    if (findPurchaseInfoEmptyError()) return 'purchase-empty';
    if (findProductDisabledError()) return 'disabled';
    if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
    if (findReviewConfirmButton()) return 'confirm';
    const error = new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u54cd\u5e94\u8d85\u65f6');
    error.code = 'PFH_REVIEW_CONFIRM_TIMEOUT';
    throw error;
  }

  function findProductReviewButton() {
    return findProductDrawerActionButton('\u63d0\u5ba1');
  }

  async function fillMinimumOrderQuantityIfNeeded() {
    const item = findMinimumOrderQuantityErrorItem();
    if (!item) return false;
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    if (!input) return false;
    setNativeInputValue(input, '1000');
    await wait(300);
    return true;
  }

  function findMinimumOrderQuantityItem() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, '\u6700\u5c0f\u8d77\u8ba2\u91cf');
  }

  function findMinimumOrderQuantityErrorItem() {
    const item = findMinimumOrderQuantityItem();
    if (!item) return null;
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    const value = input ? compactText(input.value || '') : '';
    const text = getVisibleText(item);
    const hasError = /\u8bf7\u8f93\u5165\u6700\u5c0f\u8d77\u8ba2\u91cf|ant-form-item-has-error|ant-form-item-explain-error/.test(text + ' ' + (item.className || '') + ' ' + (item.innerHTML || ''));
    return hasError && !value ? item : null;
  }

  function findPurchaseInfoEmptyError() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const scope = drawer || document.body;
    const text = getNodeText(scope);
    if (/\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(text)) return true;
    const errorRoot = drawer || document;
    const errorNodes = Array.from(errorRoot.querySelectorAll('.ant-form-item-explain-error, .ant-form-item-has-error, [role="alert"], .ant-message-notice, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID));
    if (errorNodes.some((node) => /\u91c7\u8d2d\u4fe1\u606f|\u4e0d\u53ef\u4e3a\u7a7a/.test(getNodeText(node) + ' ' + (node.className || '') + ' ' + (node.innerHTML || '')))) return true;
    const purchaseTitle = Array.from(scope.querySelectorAll('.ant-form-item-label label, .ant-collapse-header, .ant-anchor-link-title, [title]')).find((node) => compactText(node.innerText || node.textContent || node.getAttribute('title')) === '\u91c7\u8d2d\u4fe1\u606f');
    const purchaseSection = purchaseTitle && (purchaseTitle.closest('.ant-form-item') || purchaseTitle.parentElement);
    if (purchaseSection && /ant-form-item-has-error|ant-form-item-explain-error|\u4e0d\u53ef\u4e3a\u7a7a/.test((purchaseSection.className || '') + ' ' + (purchaseSection.innerHTML || ''))) return true;
    return false;
  }

  function findProductDisabledError() {
    const text = getVisibleText(document.body);
    return /\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528|\u5f53\u524d\u4ea7\u54c1\u5df2\u505c\u7528|\u4ea7\u54c1\u5df2\u505c\u7528/.test(text);
  }

  async function saveProductDraftBeforeClose() {
    const saveDraft = findSaveDraftButton();
    if (!saveDraft) throw new Error('\u672a\u627e\u5230\u4fdd\u5b58\u8349\u7a3f\u6309\u94ae');
    const noticeSnapshot = new Map(getPlmNoticeNodes().map((node) => [node, getNodeText(node)]));
    saveDraft.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    saveDraft.click();
    const result = await waitUntil(() => {
      const freshNoticeText = getPlmNoticeNodes()
        .filter((node) => !noticeSnapshot.has(node) || noticeSnapshot.get(node) !== getNodeText(node))
        .map((node) => getNodeText(node))
        .join('\n');
      if (/\u8349\u7a3f\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u6210\u529f|\u8349\u7a3f.*\u4fdd\u5b58.*\u6210\u529f|\u4fdd\u5b58\u6210\u529f/.test(freshNoticeText)) return 'saved';
      if (/\u8349\u7a3f.*\u672a\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u5931\u8d25|\u8349\u7a3f.*\u4fdd\u5b58.*\u5931\u8d25/.test(freshNoticeText)) return 'failed';
      if (findPurchaseInfoEmptyError()) return '';
      return '';
    }, 8000, 100).catch(() => '');
    return result === 'saved';
  }

  function findSaveDraftButton() {
    const bottomButton = findProductDrawerActionButton('\u4fdd\u5b58\u8349\u7a3f');
    if (bottomButton) return bottomButton;
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => /(?:\u7f16\u8f91\u5546\u54c1|\u8bbe\u8ba1\u8d44\u6599)/.test(getNodeText(drawer)));
    for (const drawer of drawers.reverse()) {
      const button = Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f');
      if (button) return button;
    }
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f') || null;
  }

  function findProductDrawerActionButton(text) {
    const normalizedText = compactText(text).replace(/\s+/g, '');
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => /(?:\u7f16\u8f91\u5546\u54c1|\u8bbe\u8ba1\u8d44\u6599)/.test(getNodeText(drawer)));
    const candidates = drawers.flatMap((drawer) => {
      const drawerRect = drawer.getBoundingClientRect();
      return Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .filter(isActionButtonReady)
        .filter((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === normalizedText)
        .map((button) => ({ button, rect: button.getBoundingClientRect(), drawerRect }));
    }).filter(({ rect, drawerRect }) => rect.width > 0 && rect.height > 0 && rect.top >= drawerRect.top && rect.bottom <= drawerRect.bottom + 2);
    candidates.sort((a, b) => b.rect.top - a.rect.top || b.rect.left - a.rect.left);
    return candidates[0] ? candidates[0].button : null;
  }

  function isActionButtonReady(button) {
    return Boolean(button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' && !/\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(button.className || ''));
  }

  function getPlmNoticeNodes() {
    return Array.from(document.querySelectorAll('.ant-message, .ant-message-notice, .ant-notification, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID));
  }

  function getPlmNoticeText() {
    return getPlmNoticeNodes()
      .map((node) => getNodeText(node))
      .join('\n');
  }

  async function saveDraftThenClosePurchaseEmptyProduct() {
    if (!findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    const existingModal = getVisibleModal();
    if (existingModal) {
      if (isCancelConfigModal(existingModal)) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
        await waitUntil(() => findPurchaseInfoEmptyError(), 5000, 100);
      } else {
        closeVisibleModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      }
    }
    const saved = await saveProductDraftBeforeClose();
    if (!saved) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(getUploadControlMode(), false);
      throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f\uff0c\u5df2\u6682\u505c');
    }
    const running = getCurrentRunningUpload(loadUploadQueue(), getUploadControlMode());
    if (running) updateUploadItem(running, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u9875\u5173\u95ed\u6309\u94ae');
    close.click();
    const modal = await waitUntil(() => {
      const topModal = getVisibleModal();
      return topModal && isCancelConfigModal(topModal) ? topModal : null;
    }, 10000, 100);
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal() && !getOpenProductDrawer(), 10000, 100);
    return { draftSaved: true };
  }

  async function closeTopProductDrawer(options) {
    const result = { draftSaved: false };
    if (!(options && options.allowReviewResultModal)) assertNoReviewConfirmModal();
    if (options && options.allowReviewResultModal && isReviewConfirmModal(getVisibleModal())) {
      await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
    }
    const existingModal = getVisibleModal();
    if (existingModal && isCancelConfigModal(existingModal)) {
      if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      } else {
        confirmCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      }
    } else if (existingModal) {
      closeVisibleModal(existingModal);
      await waitUntil(() => !getVisibleModal(), 10000, 100);
    }
    if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
      const saved = await saveProductDraftBeforeClose().catch((error) => {
        console.warn('PLM floating helper save draft before close failed:', error);
        return false;
      });
      result.draftSaved = saved;
      if (!saved) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) return result;
    close.click();
    await waitUntil(() => {
      const topModal = getVisibleModal();
      if (topModal) {
        if (isReviewConfirmModal(topModal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5546\u54c1\u9875');
        if (isCancelConfigModal(topModal)) {
          confirmCancelConfigModal(topModal);
          return false;
        }
        closeVisibleModal(topModal);
        return false;
      }
      const topDrawer = getOpenProductDrawer();
      return !topDrawer;
    }, 10000, 100);
    return result;
  }

  function closeVisibleModal(modal) {
    if (!modal) return false;
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5f39\u7a97');
    const close = Array.from(modal.querySelectorAll('button, .ant-modal-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        return text === '\u53d6\u6d88' || /\u5173\u95ed|close|ant-modal-close/i.test(signature);
      });
    if (!close) throw new Error('\u672a\u627e\u5230\u5173\u95ed\u5f39\u7a97\u6309\u94ae');
    close.click();
    return true;
  }

  function confirmCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    if (!modal || !isCancelConfigModal(modal)) return false;
    const confirm = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u786e\u5b9a');
    if (!confirm) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u786e\u5b9a\u6309\u94ae');
    confirm.click();
    return true;
  }

  async function closeCancelConfigModalIfPresent() {
    assertNoReviewConfirmModal();
    const modal = getVisibleModal();
    if (!modal || !isCancelConfigModal(modal)) return false;
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal(), 10000, 100);
    return true;
  }

  function cancelCancelConfigModal(modal) {
    if (!modal || !isCancelConfigModal(modal)) return false;
    const cancel = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u53d6\u6d88');
    if (!cancel) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u53d6\u6d88\u6309\u94ae');
    cancel.click();
    return true;
  }

  function isCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    return /\u5f53\u524d\u7c7b\u76ee\u5c5e\u6027\u4fe1\u606f\u672a\u4fdd\u5b58|\u662f\u5426\u786e\u8ba4\u53d6\u6d88\u914d\u7f6e/.test(modalText);
  }

  function isReviewConfirmModal(modal) {
    if (!modal || !isVisibleElement(modal)) return false;
    const text = getVisibleText(modal).replace(/\s+/g, '');
    if (/提审成功|产品提审成功|成功/.test(text)) return false;
    if (!/确定提交审批吗|确认提交审批|提交审批吗/.test(text)) return false;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).some((button) => {
      const buttonText = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
      const className = String(button.className || '');
      const disabled = button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(className);
      return buttonText === '\u63d0\u5ba1' && !disabled;
    });
  }

  function isReviewConfirmRequestPending() {
    return Boolean(reviewConfirmRequestedAt && Date.now() - reviewConfirmRequestedAt < REVIEW_CONFIRM_WAIT_MS);
  }

  function assertNoReviewConfirmModal() {
    const modal = getVisibleModal();
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u6216\u5207\u6362\u4e0b\u4e00\u4e2a\u7f16\u7801');
    if (isReviewConfirmRequestPending()) {
      const error = new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u6b63\u5728\u54cd\u5e94\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5546\u54c1\u9875');
      error.code = 'PFH_REVIEW_CONFIRM_TIMEOUT';
      throw error;
    }
  }

  function findDrawerCloseButton(drawer) {
    if (!drawer) return null;
    const drawerRect = drawer.getBoundingClientRect();
    return Array.from(drawer.querySelectorAll('button, .ant-drawer-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent);
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        if (/\u5173\u95ed|close|ant-drawer-close/i.test(signature)) return true;
        const rect = button.getBoundingClientRect();
        const nearDrawerLeftTop = rect.top <= drawerRect.top + 80 && rect.left <= drawerRect.left + 120 && !text;
        const nearDrawerRightTop = rect.top <= drawerRect.top + 80 && rect.right >= drawerRect.right - 100 && !text;
        return nearDrawerLeftTop || nearDrawerRightTop;
      }) || null;
  }

  function getVisibleModal() {
    return Array.from(document.querySelectorAll('.ant-modal')).filter(isVisibleElement).pop() || null;
  }

  function getOpenProductDrawer() {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open'))
      .filter(isVisibleElement)
      .find((drawer) => drawer.matches('.pdmDetailDrawer.ant-drawer-open') || getVisibleText(drawer).includes('\u7f16\u8f91\u5546\u54c1')) || null;
  }

  function findVisibleButton(text) {
    return Array.from(document.querySelectorAll('button')).filter(isVisibleElement).find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  async function waitUntil(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval || 200);
    }
    throw new Error('\u7b49\u5f85\u8d85\u65f6');
  }

  function guessMime(filename) {
    const lower = String(filename || '').toLowerCase();
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.rar')) return 'application/vnd.rar';
    return 'application/octet-stream';
  }
