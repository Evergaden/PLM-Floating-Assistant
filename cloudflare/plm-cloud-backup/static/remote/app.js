(() => {
  'use strict';

  const state = {
    token: '',
    userName: '',
    backupKey: '',
    backupUpdatedAt: '',
    products: [],
    tasks: [],
    devices: [],
    counts: {},
    screen: 'home',
    filter: 'all',
    search: '',
    pollTimer: 0,
    toastTimer: 0,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = String(message || '');
    toast.classList.add('is-visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && typeof options.body !== 'string') {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    if (state.token) headers.authorization = 'Bearer ' + state.token;
    const response = await fetch(path, { ...options, headers, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `请求失败 (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function base64Bytes(value) {
    const binary = atob(String(value || ''));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  async function decryptBackup(envelope, backupKey) {
    if (!envelope || envelope.format !== 'plm-backup-v2') return envelope;
    if (!envelope.data) throw new Error('云备份分片不完整');
    const rawKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(backupKey), { name: 'PBKDF2' }, false, ['deriveKey']);
    const iterations = Number(envelope.kdfIterations || 210000);
    const key = await crypto.subtle.deriveKey({
      name: 'PBKDF2', salt: base64Bytes(envelope.salt), iterations, hash: 'SHA-256',
    }, rawKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    let bytes;
    try {
      bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64Bytes(envelope.iv) }, key, base64Bytes(envelope.data)));
    } catch (_) {
      throw new Error('备份密码不正确或云备份已损坏');
    }
    if (envelope.compression === 'gzip') {
      if (typeof DecompressionStream !== 'function') throw new Error('请使用最新版 Chrome、Edge 或 Safari 解锁压缩备份');
      bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function firstValue(source, names) {
    for (const name of names) {
      const value = source && source[name];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
  }

  function normalizeProduct(source, skuFallback) {
    const product = source && typeof source === 'object' ? source : {};
    const sku = firstValue(product, ['sku', 'code', 'skuCode']) || String(skuFallback || '');
    const name = firstValue(product, ['name', 'productName', 'chineseName', 'skuName']) || '未命名产品';
    const brand = firstValue(product, ['brand', 'brandName']) || '未填写品牌';
    const status = firstValue(product, ['status', 'designStatus', 'finalStatus', 'auditStatus']);
    const finalizedAt = firstValue(product, ['finalizedAt', 'finalTime', 'designFinalizedAt']);
    const isFinalized = /定稿|完成|final/i.test(status) || Boolean(finalizedAt);
    return {
      raw: product,
      sku,
      name,
      brand,
      status: status || (isFinalized ? '已定稿' : '待完善'),
      isFinalized,
      image: firstValue(product, ['skuImageUrl', 'imageUrl', 'mainImageUrl', 'skuImageFallbackUrl']),
      packageSize: firstValue(product, ['packageSizeText', 'packageSize', 'boxSize']),
      productSize: firstValue(product, ['productSizeText', 'productSize']),
      netContent: firstValue(product, ['netContent', 'netWeight']),
      grossWeight: firstValue(product, ['grossWeight', 'weight']),
      packageCode: firstValue(product, ['packageCode', 'materialCode']),
      printCode: firstValue(product, ['printCode', 'printingCode']),
      updatedAt: firstValue(product, ['updatedAt', 'cacheUpdatedAt', 'finalizedAt']),
    };
  }

  function productsFromBackup(payload) {
    const items = payload && payload.items && typeof payload.items === 'object' ? payload.items : {};
    const indexed = Array.isArray(payload && payload.index) ? payload.index : [];
    const bySku = new Map();
    Object.entries(items).forEach(([sku, product]) => {
      const normalized = normalizeProduct(product, sku);
      if (normalized.sku) bySku.set(normalized.sku, normalized);
    });
    indexed.forEach((item) => {
      const source = item && typeof item === 'object' ? item : { sku: item };
      const normalized = normalizeProduct(source, source.sku || source.code);
      if (!normalized.sku) return;
      if (!bySku.has(normalized.sku)) bySku.set(normalized.sku, normalized);
    });
    return Array.from(bySku.values()).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || a.sku.localeCompare(b.sku));
  }

  function formatTime(value, includeDate = false) {
    if (!value) return '—';
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(' ', 'T') + 'Z' : value;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return String(value);
    const options = includeDate
      ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('zh-CN', options).format(date);
  }

  function productThumb(product, className = '') {
    const fallback = escapeHtml((product.brand || product.sku || 'PLM').slice(0, 3).toUpperCase());
    const image = product.image ? `<img src="${escapeHtml(product.image)}" alt="" loading="lazy" onerror="this.remove()">` : '';
    return `<div class="product-thumb ${className}">${image}<span>${fallback}</span></div>`;
  }

  function navigate(screen) {
    state.screen = screen;
    $$('.screen').forEach((element) => element.classList.toggle('is-active', element.dataset.screen === screen));
    $$('[data-nav]').forEach((button) => button.classList.toggle('is-active', button.dataset.nav === screen));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (screen === 'products') renderProducts();
    if (screen === 'tasks') renderTasks();
  }

  function currentDevice() {
    return state.devices.find((device) => device.online) || state.devices[0] || null;
  }

  function renderOverview() {
    const device = currentDevice();
    const online = Boolean(device && device.online);
    const capabilities = device && device.capabilities || {};
    $('#device-title').textContent = online ? '电脑工作台在线' : device ? '电脑工作台已离线' : '等待电脑工作台';
    $('#device-detail').textContent = online
      ? `${device.name || 'PLM 产品资产工作台'} · ${capabilities.bridgeConnected ? '悬浮助手已连接' : '悬浮助手未连接'}`
      : device ? `最后在线 ${formatTime(device.lastSeenAt, true)}` : '请先在电脑端开启远程连接';
    $('#device-signal').classList.toggle('offline', !online);
    $('#product-count').textContent = String(state.products.length);
    $('#queue-count').textContent = String(Number(state.counts.queued || 0) + Number(state.counts.running || 0));
    $('#done-count').textContent = String(Number(state.counts.succeeded || 0));
    $('#product-total-badge').textContent = String(state.products.length);
    $('#welcome-name').textContent = `${state.userName || '你好'} · 手机端`;
    $('#profile-name').textContent = state.userName || '—';
    $('#profile-avatar').textContent = (state.userName || 'P').slice(0, 1).toUpperCase();
    $('#profile-device').textContent = online ? '在线' : '离线';
    $('#profile-bridge').textContent = capabilities.bridgeConnected ? '已连接' : '未连接';
    $('#profile-root').textContent = capabilities.assetRootReady ? '已配置' : '未配置';
    $('#profile-backup').textContent = formatTime(state.backupUpdatedAt, true);
    $('#backup-time').textContent = `加密备份更新于 ${formatTime(state.backupUpdatedAt, true)}`;
    const pending = Number(state.counts.queued || 0) + Number(state.counts.running || 0);
    $('#task-nav-badge').hidden = !pending;
    $('#task-nav-badge').textContent = pending > 99 ? '99+' : String(pending);
  }

  function visibleProducts() {
    const query = state.search.trim().toLocaleLowerCase();
    return state.products.filter((product) => {
      if (state.filter === 'finalized' && !product.isFinalized) return false;
      if (state.filter === 'incomplete' && product.isFinalized) return false;
      return !query || [product.sku, product.name, product.brand].some((value) => String(value).toLocaleLowerCase().includes(query));
    });
  }

  function renderProducts() {
    const products = visibleProducts();
    const root = $('#product-list');
    if (!products.length) {
      root.innerHTML = '<div class="empty-block"><i>⌕</i><strong>没有找到匹配产品</strong><span>换个 SKU、产品名或品牌试试</span></div>';
      return;
    }
    root.innerHTML = products.map((product, index) => `<button class="product-card" type="button" data-product-sku="${escapeHtml(product.sku)}" style="animation-delay:${Math.min(index, 8) * 25}ms">
      ${productThumb(product)}<div><small>${escapeHtml(product.sku)}</small><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.brand)} · ${escapeHtml(product.status)}</span></div><i>›</i>
    </button>`).join('');
  }

  const TASK_LABELS = {
    'generate-assets': ['▦', '生成资产'],
    'sync-products': ['↻', '刷新定稿'],
    'scan-upload': ['⌁', '扫描并上传'],
    note: ['✦', '文字指令'],
  };
  const STATUS_LABELS = { queued: '等待电脑', running: '执行中', succeeded: '已完成', failed: '失败', cancelled: '已取消' };

  function taskHtml(task) {
    const meta = TASK_LABELS[task.type] || ['◇', '远程任务'];
    const detail = task.error || task.result && task.result.message || `${meta[1]} · ${formatTime(task.createdAt, true)}`;
    return `<article class="task-row"><i class="task-icon">${meta[0]}</i><div><strong>${escapeHtml(task.title || meta[1])}</strong><small>${escapeHtml(detail)}</small></div><span class="task-state ${escapeHtml(task.status)}">${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span></article>`;
  }

  function renderTasks() {
    const html = state.tasks.length ? state.tasks.map(taskHtml).join('') : '<div class="empty-block"><i>✓</i><strong>还没有远程任务</strong><span>从首页或产品详情下达第一条指令</span></div>';
    $('#task-list').innerHTML = html;
    $('#home-task-list').innerHTML = state.tasks.length ? state.tasks.slice(0, 3).map(taskHtml).join('') : '<div class="empty-block"><strong>任务记录会显示在这里</strong></div>';
    $('#summary-queued').textContent = String(Number(state.counts.queued || 0));
    $('#summary-running').textContent = String(Number(state.counts.running || 0));
    $('#summary-succeeded').textContent = String(Number(state.counts.succeeded || 0));
  }

  async function refreshRemote(options = {}) {
    if (!state.token) return;
    try {
      const [overview, taskData] = await Promise.all([api('/remote-api/overview'), api('/remote-api/tasks?limit=60')]);
      state.devices = overview.devices || [];
      state.counts = overview.counts || {};
      state.tasks = taskData.tasks || [];
      renderOverview();
      renderTasks();
      if (options.toast) showToast('状态已刷新');
    } catch (error) {
      if (error.status === 401) logout(false);
      else if (options.toast) showToast(error.message);
    }
  }

  async function createTask(type, payload = {}) {
    try {
      const data = await api('/remote-api/tasks', { method: 'POST', body: { type, payload } });
      state.tasks.unshift(data.task);
      state.counts.queued = Number(state.counts.queued || 0) + 1;
      renderOverview();
      renderTasks();
      showToast('指令已发送，等待电脑领取');
      return data.task;
    } catch (error) {
      showToast(error.message);
      return null;
    }
  }

  function openSheet(id) {
    $('#sheet-backdrop').hidden = false;
    $(id).hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeSheets() {
    $('#sheet-backdrop').hidden = true;
    $$('.bottom-sheet').forEach((sheet) => { sheet.hidden = true; });
    document.body.style.overflow = '';
  }

  function openProduct(sku) {
    const product = state.products.find((item) => item.sku === sku);
    if (!product) return;
    $('#product-sheet-content').innerHTML = `<div class="sheet-product-head">${productThumb(product)}<div><strong>${escapeHtml(product.sku)}</strong><h2>${escapeHtml(product.name)}</h2><span>${escapeHtml(product.brand)} · ${escapeHtml(product.status)}</span></div></div>
      <div class="product-facts">
        <div><span>包装尺寸</span><strong>${escapeHtml(product.packageSize || '未填写')}</strong></div>
        <div><span>产品尺寸</span><strong>${escapeHtml(product.productSize || '未填写')}</strong></div>
        <div><span>净含量</span><strong>${escapeHtml(product.netContent || '未填写')}</strong></div>
        <div><span>毛重</span><strong>${escapeHtml(product.grossWeight || '未填写')}</strong></div>
        <div><span>包装编码</span><strong>${escapeHtml(product.packageCode || '未填写')}</strong></div>
        <div><span>印刷编码</span><strong>${escapeHtml(product.printCode || '未填写')}</strong></div>
      </div>
      <div class="sheet-actions"><button class="primary-button" type="button" data-generate-sku="${escapeHtml(product.sku)}"><span>让电脑生成全部资产</span><b>→</b></button><button class="sheet-secondary" type="button" data-upload-sku="${escapeHtml(product.sku)}">扫描该 SKU 并加入上传</button></div>`;
    openSheet('#product-sheet');
  }

  async function login(event) {
    event.preventDefault();
    const button = $('#login-button');
    const errorBox = $('#login-error');
    const name = $('#login-name').value.trim();
    const backupKey = $('#login-key').value;
    errorBox.textContent = '';
    button.disabled = true;
    button.querySelector('span').textContent = '正在安全解锁…';
    try {
      const session = await api('/remote-api/login', { method: 'POST', body: { name, backupKey } });
      state.token = session.token;
      state.userName = session.user && session.user.name || name;
      state.backupKey = backupKey;
      localStorage.setItem('plm-remote.last-name', state.userName);
      const backup = await api('/remote-api/backup');
      const payload = await decryptBackup(backup.payload, backupKey);
      state.products = productsFromBackup(payload);
      state.backupUpdatedAt = backup.updatedAt || session.backup && session.backup.updatedAt || '';
      $('#profile-name').textContent = state.userName;
      $('#login-view').hidden = true;
      $('#app-view').hidden = false;
      $('#login-key').value = '';
      renderProducts();
      await refreshRemote();
      renderOverview();
      state.pollTimer = window.setInterval(() => refreshRemote(), 8000);
      showToast(`已安全解锁 ${state.products.length} 个产品`);
    } catch (error) {
      state.token = '';
      state.backupKey = '';
      errorBox.textContent = error.message === 'name or backup password incorrect' ? '姓名或备份密码不正确' : error.message;
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = '进入远程工作台';
    }
  }

  function logout(reload = true) {
    window.clearInterval(state.pollTimer);
    state.token = '';
    state.backupKey = '';
    state.products = [];
    state.tasks = [];
    if (reload) window.location.reload();
    else {
      $('#app-view').hidden = true;
      $('#login-view').hidden = false;
      $('#login-error').textContent = '会话已过期，请重新登录';
    }
  }

  function bindEvents() {
    $('#login-form').addEventListener('submit', login);
    $('#refresh-button').addEventListener('click', () => refreshRemote({ toast: true }));
    $('#logout-button').addEventListener('click', () => logout());
    $$('[data-nav]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.nav)));
    $$('[data-nav-target]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.navTarget)));
    $$('[data-open-products]').forEach((button) => button.addEventListener('click', () => navigate('products')));
    $$('[data-open-note], #new-note-button').forEach((button) => button.addEventListener('click', () => openSheet('#note-sheet')));
    $$('[data-command]').forEach((button) => button.addEventListener('click', () => createTask(button.dataset.command, button.dataset.command === 'scan-upload' ? { autoStart: true } : {})));
    $('#product-search').addEventListener('input', (event) => { state.search = event.target.value; renderProducts(); });
    $('#clear-search').addEventListener('click', () => { $('#product-search').value = ''; state.search = ''; renderProducts(); });
    $$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      $$('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
      renderProducts();
    }));
    $('#product-list').addEventListener('click', (event) => {
      const card = event.target.closest('[data-product-sku]');
      if (card) openProduct(card.dataset.productSku);
    });
    $('#product-sheet').addEventListener('click', async (event) => {
      const generate = event.target.closest('[data-generate-sku]');
      const upload = event.target.closest('[data-upload-sku]');
      if (generate) { closeSheets(); await createTask('generate-assets', { sku: generate.dataset.generateSku }); }
      if (upload) { closeSheets(); await createTask('scan-upload', { sku: upload.dataset.uploadSku, autoStart: true }); }
    });
    $('#send-note-button').addEventListener('click', async () => {
      const input = $('#note-input');
      const note = input.value.trim();
      if (!note) return showToast('请先填写任务内容');
      const task = await createTask('note', { note });
      if (task) { input.value = ''; closeSheets(); }
    });
    $('#sheet-backdrop').addEventListener('click', closeSheets);
    $$('[data-close-sheet]').forEach((button) => button.addEventListener('click', closeSheets));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && state.token) refreshRemote(); });
  }

  function init() {
    $('#login-name').value = localStorage.getItem('plm-remote.last-name') || '';
    bindEvents();
    renderProducts();
    renderTasks();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/remote/sw.js', { scope: '/remote/' }).catch(() => {});
  }

  init();
})();
