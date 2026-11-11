
  function buildExcelKeyword(data, extra) {
    if (state.settings.excelKeywordMode === 'brandName') {
      return [data.brand, data.name || (extra && extra.chineseName)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    return (extra && extra.englishName) || '';
  }

  function buildExcelFileName(data, extra) {
    const parts = [data.brand, data.name || (extra && extra.chineseName), data.sku].map(cleanFileNamePart).filter(Boolean);
    const base = parts.join(' ').replace(/\s+/g, ' ').trim();
    return sanitizeExcelFileName((base || data.sku || 'PLM\u4ea7\u54c1\u4fe1\u606f') + '.xlsx');
  }

  function cleanFileNamePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const EXCEL_FILE_NAME_MAX_LENGTH = 100;
  const EXCEL_FILE_NAME_MAX_BYTES = 180;

  function excelFileNameByteLength(value) {
    return Array.from(value).reduce((total, character) => {
      const point = character.codePointAt(0);
      // Browser downloads replace spaces with NBSP; reserve two bytes for each space.
      return total + (point === 32 ? 2 : point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
    }, 0);
  }

  function sanitizeExcelFileName(filename) {
    const value = String(filename || '').replace(/\.xlsx$/i, '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const stem = value || 'PLM\u4ea7\u54c1\u4fe1\u606f';
    const extension = '.xlsx';
    if (stem.length + extension.length <= EXCEL_FILE_NAME_MAX_LENGTH && excelFileNameByteLength(stem + extension) <= EXCEL_FILE_NAME_MAX_BYTES) return stem + extension;
    const skuMatch = stem.match(/(?:^|\s)(SKU\d{1,32}(?:\s+等\d{1,6}个SKU)?)$/i);
    const suffix = skuMatch ? ' ' + skuMatch[1] : '';
    const reserved = '...' + suffix + extension;
    const maxLength = EXCEL_FILE_NAME_MAX_LENGTH - reserved.length;
    const maxBytes = EXCEL_FILE_NAME_MAX_BYTES - excelFileNameByteLength(reserved);
    const source = skuMatch ? stem.slice(0, skuMatch.index) : stem;
    let shortened = '';
    let bytes = 0;
    for (const character of source) {
      const characterBytes = excelFileNameByteLength(character);
      if (shortened.length + character.length > maxLength || bytes + characterBytes > maxBytes) break;
      shortened += character;
      bytes += characterBytes;
    }
    return shortened.trimEnd() + reserved;
  }

  function toBrowserDownloadFileName(filename) {
    return sanitizeDownloadFileName(filename).replace(/ /g, '\u00a0');
  }

  function sanitizeDownloadFileName(filename) {
    const raw = String(filename || '').trim();
    const match = raw.match(/(\.[a-z0-9]{2,8})$/i);
    const ext = match ? match[1] : '';
    const stem = (ext ? raw.slice(0, -ext.length) : raw).replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (stem || 'PLM\u6587\u4ef6') + ext;
  }

  async function chooseExcelSaveTarget(filename) {
    if (state.settings.excelDownloadMode === 'direct') return { type: 'download', direct: true };
    const picker = getSaveFilePicker();
    if (!picker) return { type: 'download' };
    try {
      const handle = await picker({
        suggestedName: sanitizeExcelFileName(filename),
        types: [{
          description: 'Excel Workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      return { type: 'fileSystem', handle };
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      console.warn('PLM floating helper save picker failed, fallback to download:', error);
      showToast(L.excelSavePickerUnavailable);
      return { type: 'download' };
    }
  }

  function getSaveFilePicker() {
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.showSaveFilePicker === 'function') {
      return (options) => unsafeWindow.showSaveFilePicker(options);
    }
    if (typeof window.showSaveFilePicker === 'function') return (options) => window.showSaveFilePicker(options);
    return null;
  }

  function getDirectoryPicker() {
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.showDirectoryPicker === 'function') {
      return (options) => unsafeWindow.showDirectoryPicker(options);
    }
    if (typeof window.showDirectoryPicker === 'function') return (options) => window.showDirectoryPicker(options);
    return null;
  }

  async function writeImageBlobToFileHandle(handle, blob) {
    const writable = await handle.createWritable();
    try {
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch (_) {}
      throw error;
    }
  }

  async function saveImageFiles(files) {
    const items = (Array.isArray(files) ? files : [])
      .map((item) => ({ name: sanitizeDownloadFileName(item && item.name), dataUrl: String(item && (item.dataUrl || item.url) || '') }))
      .filter((item) => item.name && item.dataUrl);
    if (!items.length) return { mode: 'empty', count: 0 };

    let directory = null;
    const directoryPicker = getDirectoryPicker();
    if (directoryPicker) {
      try {
        directory = await directoryPicker({ mode: 'readwrite' });
      } catch (error) {
        if (error && error.name === 'AbortError') return { mode: 'cancelled', cancelled: true, count: 0 };
        // Permission/security errors fall back to the existing per-file picker.
      }
    }

    const blobs = await Promise.all(items.map(async (item) => {
      const response = await fetch(item.dataUrl);
      if (!response.ok) throw new Error('图片数据读取失败');
      return { ...item, blob: await response.blob() };
    }));

    if (directory) {
      for (const item of blobs) {
        const handle = await directory.getFileHandle(item.name, { create: true });
        await writeImageBlobToFileHandle(handle, item.blob);
      }
      return { mode: 'folder', count: blobs.length };
    }

    const picker = getSaveFilePicker();
    if (!picker) return { mode: 'unsupported', count: 0 };
    for (const item of blobs) {
      const handle = await picker({
        suggestedName: item.name,
        types: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }],
      });
      await writeImageBlobToFileHandle(handle, item.blob);
    }
    return { mode: 'files', count: blobs.length };
  }

  async function saveExcelBlob(blob, filename, target) {
    if (target && target.type === 'fileSystem' && target.handle) {
      const writable = await target.handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }
    if (!target || !target.direct) showToast(L.excelSavePickerUnavailable);
    downloadBlob(blob, sanitizeExcelFileName(filename));
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function fetchImageForExcel(url, fallbackUrl) {
    return new Promise((resolve, reject) => {
      const done = async (arrayBuffer, contentType) => {
        const extension = /png/i.test(contentType || url) ? 'png' : 'jpeg';
        const dataUrl = 'data:image/' + extension + ';base64,' + arrayBufferToBase64(arrayBuffer);
        const size = await getImageSize(dataUrl).catch(() => ({ width: 118, height: 64 }));
        resolve({ dataUrl, extension, width: size.width, height: size.height });
      };
      const request = (targetUrl, allowFallback) => {
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            responseType: 'arraybuffer',
            timeout: 8000,
            onload: (res) => {
              if (res.status >= 200 && res.status < 300) done(res.response, res.responseHeaders || targetUrl);
              else if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
              else reject(new Error('image status ' + res.status));
            },
            onerror: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request failed')),
            ontimeout: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request timeout')),
          });
          return;
        }
        fetchWithTimeout(targetUrl, 8000).then((res) => {
          if (!res.ok) throw new Error('image status ' + res.status);
          return res.arrayBuffer().then((buffer) => done(buffer, res.headers.get('content-type') || targetUrl));
        }).catch((error) => {
          if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
          else reject(error);
        });
      };
      request(url, true);
    });
  }

  function getLedgerAiImageContentType(headers, url) {
    const headerMatch = String(headers || '').match(/(?:^|\r?\n)content-type:\s*([^\r\n]+)/i);
    const headerType = headerMatch ? String(headerMatch[1]).trim().split(';')[0].toLowerCase() : '';
    if (headerType) return headerType;
    if (/\.jpe?g(?:[?#]|$)/i.test(String(url || ''))) return 'image/jpeg';
    if (/\.webp(?:[?#]|$)/i.test(String(url || ''))) return 'image/webp';
    if (/\.gif(?:[?#]|$)/i.test(String(url || ''))) return 'image/gif';
    if (/\.svg(?:[?#]|$)/i.test(String(url || ''))) return 'image/svg+xml';
    return 'image/png';
  }

  function fetchLedgerAiImageBlob(url) {
    return new Promise((resolve, reject) => {
      const targetUrl = String(url || '').trim();
      if (!targetUrl) {
        reject(new Error('图片地址为空'));
        return;
      }
      const resolveArrayBuffer = (buffer, contentType) => {
        if (buffer instanceof ArrayBuffer) {
          resolve(new Blob([buffer], { type: contentType }));
          return;
        }
        if (buffer instanceof Blob) {
          resolve(buffer);
          return;
        }
        if (buffer && buffer.buffer instanceof ArrayBuffer) {
          resolve(new Blob([buffer.buffer], { type: contentType }));
          return;
        }
        reject(new Error('图片响应格式无法识别'));
      };
      // Transient network failures (proxy hiccups, CDN connection resets) show
      // up as GM onerror with no status code. Retry twice with backoff before
      // giving up; a real HTTP error still fails immediately.
      const attempts = [0, 600, 1800];
      const attemptCount = attempts.length;
      if (typeof GM_xmlhttpRequest === 'function') {
        const run = (attemptIndex) => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            responseType: 'arraybuffer',
            timeout: 30000,
            onload: (response) => {
              if (response.status < 200 || response.status >= 300) {
                reject(new Error('图片下载失败：HTTP ' + response.status));
                return;
              }
              resolveArrayBuffer(response.response, getLedgerAiImageContentType(response.responseHeaders, targetUrl));
            },
            onerror: () => {
              if (attemptIndex + 1 < attemptCount) {
                setTimeout(() => run(attemptIndex + 1), attempts[attemptIndex + 1]);
                return;
              }
              reject(new Error('图片下载失败：网络错误（已重试 ' + (attemptCount - 1) + ' 次，请检查网络或代理）'));
            },
            ontimeout: () => {
              if (attemptIndex + 1 < attemptCount) {
                setTimeout(() => run(attemptIndex + 1), attempts[attemptIndex + 1]);
                return;
              }
              reject(new Error('图片下载失败：请求超时（已重试 ' + (attemptCount - 1) + ' 次）'));
            },
          });
        };
        run(0);
        return;
      }
      const runFetch = (attemptIndex) => {
        fetchWithTimeout(targetUrl, 30000).then((response) => {
          if (!response.ok) throw new Error('图片下载失败：HTTP ' + response.status);
          return response.blob();
        }).then(resolve).catch((error) => {
          const transient = !(error && /图片下载失败：HTTP/.test(String(error && error.message)));
          if (transient && attemptIndex + 1 < attemptCount) {
            setTimeout(() => runFetch(attemptIndex + 1), attempts[attemptIndex + 1]);
            return;
          }
          reject(error);
        });
      };
      runFetch(0);
    });
  }

  function fetchWithTimeout(url, timeout, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  function getImageSize(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function getExcelImageAnchor(imageInfo, rowOffset) {
    const boxWidth = 170;
    const boxHeight = 124;
    const width = Number(imageInfo.width) || boxWidth;
    const height = Number(imageInfo.height) || boxHeight;
    const ratio = Math.min(boxWidth / width, boxHeight / height);
    const fitWidth = Math.max(1, Math.round(width * ratio));
    const fitHeight = Math.max(1, Math.round(height * ratio));
    return {
      tl: { col: 2.85, row: 3.17 + (Number(rowOffset) || 0) },
      ext: { width: fitWidth, height: fitHeight },
      editAs: 'oneCell',
    };
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function downloadBlob(blob, filename) {
    const safeName = sanitizeDownloadFileName(filename);
    const browserName = toBrowserDownloadFileName(safeName);
    const panel = ensurePanel();
    state.ignoreOutsideClickUntil = Date.now() + 1500;
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = browserName;
    panel.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  async function createStoredZipBlob(files, onProgress) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((Math.floor(now.getSeconds() / 2)) & 31);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const nameBytes = encoder.encode(String(file.path || file.filename || ('file-' + index)));
      const data = new Uint8Array(await file.blob.arrayBuffer());
      if (data.byteLength > 0xffffffff || offset > 0xffffffff) throw new Error('ZIP file is too large');
      const crc = crc32Bytes(data);
      const local = new Uint8Array(30);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.byteLength, true);
      lv.setUint32(22, data.byteLength, true);
      lv.setUint16(26, nameBytes.byteLength, true);
      const central = new Uint8Array(46);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.byteLength, true);
      cv.setUint32(24, data.byteLength, true);
      cv.setUint16(28, nameBytes.byteLength, true);
      cv.setUint32(42, offset, true);
      localParts.push(local, nameBytes, data);
      centralParts.push(central, nameBytes);
      offset += local.byteLength + nameBytes.byteLength + data.byteLength;
      if (typeof onProgress === 'function') onProgress(index + 1, files.length);
      await wait(0);
    }
    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    return new Blob(localParts.concat(centralParts, end), { type: 'application/zip' });
  }

  function crc32Bytes(bytes) {
    if (!crc32Bytes.table) {
      crc32Bytes.table = Array.from({ length: 256 }, (_, value) => {
        let entry = value;
        for (let bit = 0; bit < 8; bit += 1) entry = (entry >>> 1) ^ (0xedb88320 & -(entry & 1));
        return entry >>> 0;
      });
    }
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) crc = (crc >>> 8) ^ crc32Bytes.table[(crc ^ bytes[index]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function downloadToyLabelBatchArchive(options) {
    const opts = options || {};
    const memoryFiles = Array.isArray(state.toyLabelBatchFiles) ? state.toyLabelBatchFiles.splice(0) : [];
    const manifest = loadToyLabelExportManifest();
    const persistedFiles = [];
    for (const entry of manifest.files) {
      const blob = await getUploadFile(entry.key).catch((error) => {
        console.warn('PLM floating helper toy label staged file read failed:', error);
        return null;
      });
      if (blob) persistedFiles.push({ sku: entry.sku, filename: entry.filename, blob });
    }
    const files = [];
    const seen = new Set();
    persistedFiles.concat(memoryFiles).forEach((file) => {
      const key = String(file && file.sku || '') + '\u0000' + String(file && file.filename || '');
      if (!file || !file.blob || !file.filename || seen.has(key)) return;
      seen.add(key);
      files.push(file);
    });
    if (!files.length) {
      addLog('warn', '批量玩具标签：没有可打包的 PSD 和图片', '');
      return false;
    }
    const nativeZipFiles = files.map((file) => ({
      ...file,
      path: (cleanFileNamePart(file.sku || '\u73a9\u5177\u6807\u7b7e') || '\u73a9\u5177\u6807\u7b7e') + '/' + sanitizeDownloadFileName(file.filename),
    }));
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u5199\u5165 ZIP', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    const nativeBlob = await createStoredZipBlob(nativeZipFiles, (done, total) => {
      state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + done + '/' + total;
    });
    downloadBlob(nativeBlob, '\u73a9\u5177\u6807\u7b7e\u6279\u91cf\u5305_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;

    const Zip = getLazyExternalRuntime('jszip') || await ensureLazyExternalScript('jszip').catch(() => null);
    if (!Zip) {
      files.forEach((file) => downloadBlob(file.blob, file.filename));
      if (opts.keepStagedFiles) {
        manifest.downloaded = true;
        saveToyLabelExportManifest(manifest);
      } else await clearToyLabelExportManifest(manifest);
      showToast('未加载压缩组件，已逐个下载玩具标签文件');
      return false;
    }
    const zip = new Zip();
    let validCount = 0;
    files.forEach((file) => {
      if (!file || !file.blob || !file.filename) return;
      const folder = cleanFileNamePart(file.sku || '玩具标签') || '玩具标签';
      zip.file(folder + '/' + sanitizeDownloadFileName(file.filename), file.blob);
      validCount += 1;
    });
    if (!validCount) {
      addLog('warn', '批量玩具标签：文件内容不完整', '');
      return false;
    }
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u7ec4\u88c5 ZIP', validCount + '\u4e2a\u6587\u4ef6');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true }, (metadata) => {
      const percent = Math.floor(Number(metadata && metadata.percent) || 0);
      if (percent > 0 && percent % 25 === 0) state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + percent + '%';
    });
    downloadBlob(blob, '玩具标签批量包_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', validCount + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;
  }
