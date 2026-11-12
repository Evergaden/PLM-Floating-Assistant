  // Browser-profile disk cache. Blobs never enter SKU storage or cloud backups.
  function openLocalImageDb() {
    if (!openLocalImageDb.promise) openLocalImageDb.promise = new Promise((resolve, reject) => {
      const request = indexedDB.open('plm-floating-helper-image-cache-v1', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('images', { keyPath: 'url' }).createIndex('savedAt', 'savedAt');
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); openLocalImageDb.promise = null; };
        resolve(request.result);
      };
      request.onerror = () => { openLocalImageDb.promise = null; reject(request.error); };
    });
    return openLocalImageDb.promise;
  }

  async function localImageTransaction(mode, work) {
    const db = await openLocalImageDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Image cache unavailable'));
      work(tx.objectStore('images'), value => { result = value; });
    });
  }

  async function trimLocalImageCache(incomingBytes) {
    const entries = await localImageTransaction('readonly', (store, done) => {
      const items = [];
      const request = store.index('savedAt').openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { done(items); return; }
        items.push({ url: cursor.primaryKey, size: cursor.value.size, savedAt: cursor.value.savedAt });
        cursor.continue();
      };
    });
    let bytes = entries.reduce((sum, item) => sum + item.size, 0) + incomingBytes;
    let count = entries.length + 1;
    const expiredBefore = Date.now() - 30 * 86400000;
    const removed = entries.filter(item => {
      if (item.savedAt >= expiredBefore && bytes <= 100 * 1024 * 1024 && count <= 2000) return false;
      bytes -= item.size; count--; return true;
    });
    if (removed.length) await localImageTransaction('readwrite', store => removed.forEach(item => store.delete(item.url)));
  }

  function getLocalImageBlob(url) {
    const pending = getLocalImageBlob.pending || (getLocalImageBlob.pending = new Map());
    if (pending.has(url)) return pending.get(url);
    const task = (async () => {
      try {
        const cached = await localImageTransaction('readonly', (store, done) => {
          const request = store.get(url); request.onsuccess = () => done(request.result);
        });
        if (cached && cached.savedAt > Date.now() - 30 * 86400000) return cached.blob;
      } catch (_) { /* Restricted browser storage still permits direct display. */ }
      const blob = await fetchLedgerAiImageBlob(url);
      if (!/^image\//i.test(blob.type) || !blob.size || blob.size > 5 * 1024 * 1024) return blob;
      // Serialize pruning and writes so simultaneous downloads cannot exceed the budget.
      const write = (getLocalImageBlob.writes || Promise.resolve()).catch(() => {}).then(async () => {
        await trimLocalImageCache(blob.size);
        await localImageTransaction('readwrite', store => store.put({ url, blob, size: blob.size, savedAt: Date.now() }));
      });
      getLocalImageBlob.writes = write;
      try { await write; } catch (_) { /* Quota/private mode: keep the current image usable. */ }
      return blob;
    })().finally(() => pending.delete(url));
    pending.set(url, task);
    return task;
  }

  async function setLocalImageSource(image, url) {
    if (image.pfhLocalImageSource === url && image.getAttribute && image.getAttribute('src')) return;
    image.pfhLocalImageSource = url;
    if (!/^https?:\/\//i.test(url)) { image.src = url; return; }
    try {
      const blob = await getLocalImageBlob(url);
      if (!image.isConnected || image.pfhLocalImageSource !== url) return;
      if (image.pfhLocalObjectUrl) URL.revokeObjectURL(image.pfhLocalObjectUrl);
      const objectUrl = URL.createObjectURL(blob);
      image.pfhLocalObjectUrl = objectUrl;
      image.addEventListener('error', () => {
        if (image.pfhLocalObjectUrl !== objectUrl) return;
        URL.revokeObjectURL(objectUrl); delete image.pfhLocalObjectUrl;
        localImageTransaction('readwrite', store => store.delete(url)).catch(() => {});
        image.src = url;
      }, { once: true });
      image.src = objectUrl;
    } catch (_) {
      if (image.isConnected && image.pfhLocalImageSource === url) image.src = url;
    }
  }

  function installLocalImageCache(panel) {
    if (panel.pfhLocalImageObserver) return;
    const queue = []; let active = 0;
    const pump = () => {
      while (active < 3 && queue.length) {
        const image = queue.shift();
        if (!image.isConnected) continue;
        const url = image.getAttribute('data-local-image');
        if (!url) continue;
        image.removeAttribute('data-local-image'); active++;
        setLocalImageSource(image, url).finally(() => { active--; pump(); });
      }
    };
    const visible = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { visible.unobserve(entry.target); queue.push(entry.target); } }); pump();
    }, { root: panel, rootMargin: '160px' }) : null;
    const visit = (node, removed) => {
      if (!node.querySelectorAll) return;
      const images = [...(node.matches && node.matches('img') ? [node] : []), ...node.querySelectorAll('img')];
      images.forEach(image => {
        if (removed) {
          if (image.isConnected) return;
          if (visible) visible.unobserve(image);
          if (image.pfhLocalObjectUrl) { URL.revokeObjectURL(image.pfhLocalObjectUrl); delete image.pfhLocalObjectUrl; }
        } else if (image.hasAttribute('data-local-image')) {
          if (visible) visible.observe(image); else queue.push(image);
        }
      });
      pump();
    };
    panel.pfhLocalImageObserver = new MutationObserver(records => records.forEach(record => {
      record.removedNodes.forEach(node => visit(node, true));
      record.addedNodes.forEach(node => visit(node, false));
    }));
    panel.pfhLocalImageObserver.observe(panel, { childList: true, subtree: true });
    visit(panel, false);
  }
