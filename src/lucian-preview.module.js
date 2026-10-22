// Lucian UX/UI Prompt #092 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#092
// Lucian UX/UI Prompt #083 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#083
// Lucian UX/UI Prompt #060 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#060
  function ensureLucianPreviewStyles() {
    if (document.getElementById(PANEL_ID + '-lucian-style')) return;
    const style = document.createElement('style');
    style.id = PANEL_ID + '-lucian-style';
    style.textContent = LUCIAN_PREVIEW_CSS;
    document.documentElement.appendChild(style);
  }

  function lucianEmptySearchHtml(tokens) {
    const labels = { developer: '开发人员', brand: '品牌', status: '项目状态', designType: '设计类型', imageColor: '效果图主色' };
    const options = Object.keys(labels).filter((field) => state.skuFilters[field]).map((field) => ({
      field, label: labels[field], count: getFilteredSearchMatches(tokens, { ...state.skuFilters, [field]: '' }).length,
    })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 2);
    const queryCount = tokens.length ? getFilteredSearchMatches([], state.skuFilters).length : 0;
    if (!options.length && queryCount) options.push({ field: 'query', label: '搜索关键词', count: queryCount });
    const chips = Object.keys(labels).filter((field) => state.skuFilters[field]).map((field) => '<button type="button" class="u092-ch in" data-action="lucian-filter-remove" data-field="' + field + '" aria-label="移除' + labels[field] + '">' + escapeHtml(labels[field]) + ' ×</button>').join('');
    const suggestions = options.map((item, index) => '<button type="button" class="u092-sg" style="--i:' + index + '" data-action="lucian-filter-remove" data-field="' + item.field + '"><s>' + escapeHtml(item.label) + '</s><span>移除后显示 <b>' + item.count + ' 条</b></span><svg viewBox="0 0 15 15" aria-hidden="true"><path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11"/></svg></button>').join('');
    return '<section class="ux pfh-lucian u092 empty" aria-label="搜索建议"><div class="u092-fs">' + chips + '</div><div class="u092-none"><div class="u092-art" aria-hidden="true"><svg viewBox="0 0 150 92"><path class="u092-shelf" d="M8 30h134M8 56h134M8 82h134"/><g class="u092-lens"><circle cx="34" cy="38" r="20"/><path class="gl" d="M24 30a12 12 0 0 1 8-5"/><path d="M48 52l14 14"/></g></svg></div><p class="u092-nt">没有匹配的产品</p><p class="u092-ns">' + (suggestions ? '试着放宽一个条件' : '换个关键词，或清除筛选再试') + '</p><div class="u092-sgs">' + suggestions + '<button type="button" class="u092-sg" data-action="lucian-filter-remove" data-field="all">清除搜索和筛选</button></div></div></section>';
  }

  function handleLucianFilterAction(event, panel) {
    const button = event.target && event.target.closest && event.target.closest('[data-action="lucian-filter-remove"]');
    if (!button) return false;
    const field = button.dataset.field;
    if (button.disabled) return true;
    button.disabled = true;
    const root = button.closest('.u092');
    if (root) root.querySelectorAll('.u092-ch').forEach((chip) => { if (field === 'all' || chip.dataset.field === field) chip.classList.add('out'); });
    window.setTimeout(() => {
      if (field === 'all') Object.keys(state.skuFilters).forEach((key) => { state.skuFilters[key] = ''; });
      else if (Object.prototype.hasOwnProperty.call(state.skuFilters, field)) state.skuFilters[field] = '';
      if (field === 'all' || field === 'query') {
        state.searchQuery = '';
        panel.querySelectorAll('.pfh-search-input').forEach((input) => { input.value = ''; });
      }
      state.skuPage = 1;
      renderSkuList(panel);
      const focus = panel.querySelector('[data-action="lucian-filter-remove"]') || panel.querySelector('[data-action="sku-filter-toggle"]');
      if (focus) focus.focus({ preventScroll: true });
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 330);
    return true;
  }

  function syncLucianExcelProgress(panel) {
    const slot = panel.querySelector('[data-lucian-excel-slot]');
    if (!slot) return;
    let root = panel.pfhLucianExcelProgress;
    if (!root) {
      root = document.createElement('section');
      root.className = 'ux pfh-lucian u083';
      root.setAttribute('aria-label', 'Excel 队列进度');
      root.innerHTML = '<div class="u083-h"><i aria-hidden="true"></i><span><b>Excel 队列</b><small>按实际处理结果更新</small></span><span class="u083-pill" role="status" aria-live="polite"></span></div><div class="u083-trk" role="progressbar" aria-label="队列处理进度" aria-valuemin="0" aria-valuemax="100"><span class="u083-seg a"></span><span class="u083-seg b"></span><span class="u083-fill"></span></div><div class="u083-meta"><span class="u083-l"></span><span class="u083-r"></span></div><ol class="u083-log" aria-label="当前队列"></ol>';
      panel.pfhLucianExcelProgress = root;
    }
    if (root.parentNode !== slot) slot.appendChild(root);
    const queue = loadExcelBatchQueue();
    const settled = queue.filter((item) => ['ready', 'partial', 'downloaded', 'error'].includes(item.status)).length;
    const errors = queue.filter((item) => item.status === 'error').length;
    const running = Boolean(state.batchExcelWorkerRunning || state.batchExcelDownloadRunning);
    const paused = Boolean(state.batchExcelWorkerPaused);
    const done = Boolean(queue.length && settled === queue.length && !running && !errors);
    const progress = queue.length ? settled / queue.length : 0;
    root.classList.toggle('is-det', settled > 0 || !running || paused);
    root.classList.toggle('is-done', done);
    root.classList.toggle('is-paused', paused || !running);
    root.querySelector('.u083-pill').textContent = paused ? '已暂停' : running ? '处理中' : done ? '已完成' : errors ? '有失败项' : '待开始';
    root.querySelector('.u083-pill').style.setProperty('--c', errors ? 'var(--ux-danger)' : done ? 'var(--ux-mint)' : 'var(--ux-accent)');
    root.querySelector('.u083-l').textContent = state.batchExcelCurrentSku || (queue.length ? '已处理 ' + settled + ' / ' + queue.length : '加入 SKU 后显示进度');
    root.querySelector('.u083-r').textContent = Math.round(progress * 100) + '%';
    const track = root.querySelector('.u083-trk');
    if (running && !settled && !paused) track.removeAttribute('aria-valuenow');
    else track.setAttribute('aria-valuenow', Math.round(progress * 100));
    root.querySelector('.u083-fill').style.setProperty('--p', progress);
    const names = { pending: '等待补全', preparing: '正在补全', ready: '资料完整', partial: '有缺失字段', downloaded: '已下载', error: '失败，待重试' };
    const visible = queue.filter((item) => item.status === 'preparing').concat(queue.filter((item) => item.status !== 'preparing')).slice(0, 4);
    const log = root.querySelector('.u083-log');
    const signature = String(running) + ':' + paused + '|' + visible.map((item) => item.sku + ':' + item.status).join('|');
    if (log.pfhSignature !== signature) {
      log.innerHTML = visible.map((item) => '<li class="' + (item.status === 'error' ? 'is-error' : ['ready', 'partial', 'downloaded'].includes(item.status) ? 'ok' : item.status === 'preparing' && running && !paused ? '' : 'is-waiting') + '"><span class="u083-st" aria-hidden="true"></span><span>' + escapeHtml(item.sku) + ' · ' + escapeHtml(names[item.status] || item.status) + '</span></li>').join('');
      log.pfhSignature = signature;
    }
  }

  function lucianComparisonHtml(item) {
    if (!item || !item.parentUrl || !item.url || item.parentUrl === item.url) return '';
    return '<div class="ux pfh-lucian u060" tabindex="0" role="slider" aria-label="原图与修改图对比，修改图占比" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><div class="u060-l u060-day"><img src="' + escapeHtml(item.parentUrl) + '" alt="修改前原图" draggable="false"></div><div class="u060-l u060-night"><img src="' + escapeHtml(item.url) + '" alt="修改后图片" draggable="false"></div><span class="u060-line" aria-hidden="true"></span><span class="u060-hd" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6"/></svg></span><span class="u060-tag d">原图</span><span class="u060-tag n">修改图</span><div class="u060-cap" aria-hidden="true"><span><small>拖动对比 · 双击复位</small></span><em>50 / 50</em></div></div>';
  }

  function bindLucianComparisons(container) {
    container.querySelectorAll('.pfh-lucian.u060').forEach((root) => {
      if (root.pfhBound) return;
      root.pfhBound = true;
      let x = 50, raf = 0, drag = false;
      const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function set(value) {
        x = Math.max(0, Math.min(100, value));
        root.style.setProperty('--x', x.toFixed(2) + '%');
        root.setAttribute('aria-valuenow', Math.round(100 - x));
        root.setAttribute('aria-valuetext', '修改图 ' + Math.round(100 - x) + '%');
        root.querySelector('.u060-cap em').textContent = '原 ' + Math.round(x) + ' / 改 ' + (100 - Math.round(x));
        root.querySelector('.u060-tag.d').classList.toggle('fade', x < 30);
        root.querySelector('.u060-tag.n').classList.toggle('fade', x > 70);
      }
      function glide(to) {
        window.cancelAnimationFrame(raf);
        if (reduced()) { set(to); return; }
        let velocity = 0;
        function step() {
          if (!root.isConnected) return;
          velocity += (to - x) * .14 - velocity * .38;
          set(x + velocity);
          if (Math.abs(to - x) > .05 || Math.abs(velocity) > .05) raf = window.requestAnimationFrame(step);
          else set(to);
        }
        step();
      }
      const pctAt = (event) => { const rect = root.getBoundingClientRect(); return rect.width ? (event.clientX - rect.left) / rect.width * 100 : 50; };
      root.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        drag = true;
        root.setPointerCapture(event.pointerId);
        root.classList.add('drag');
        glide(pctAt(event));
      });
      root.addEventListener('pointermove', (event) => { if (drag) { window.cancelAnimationFrame(raf); set(pctAt(event)); } });
      const up = () => { drag = false; root.classList.remove('drag'); };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => root.addEventListener(name, up));
      root.addEventListener('dblclick', () => glide(50));
      root.addEventListener('click', (event) => event.stopPropagation());
      root.addEventListener('keydown', (event) => {
        const delta = event.key === 'ArrowRight' ? 5 : event.key === 'ArrowLeft' ? -5 : 0;
        if (delta || event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); event.stopPropagation();
          glide(event.key === 'Home' ? 0 : event.key === 'End' ? 100 : x + delta);
        }
      });
      set(50);
    });
  }
