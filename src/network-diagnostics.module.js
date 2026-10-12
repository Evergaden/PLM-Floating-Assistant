  const networkDiagnostics = {
    checking: false, open: false, offerOpen: false, checkedAt: 0, results: [],
    permissions: Object.create(null), promise: null, lastOfferedAt: 0,
    reason: '', runtimeFailure: false, runtimeComponent: '', simulation: false,
  };
  const NETWORK_DIAGNOSTICS_TIMEOUT_MS = 8000;
  const NETWORK_DIAGNOSTICS_OFFER_COOLDOWN_MS = 60000;

  function networkFailureKind(error) {
    const status = Number(error && error.status) || 0;
    if (status === 401 || status === 403 || /登录态/.test(formatErrorMessage(error))) return 'auth-error';
    if (status >= 400) return 'http-error';
    if (status > 0) return 'invalid-response';
    return error && error.cloudTransportFailure ? 'unreachable' : 'invalid-response';
  }

  function recordNetworkPermissionResult(path, response, error) {
    if (!/^\/features\//.test(path)) return;
    if (!error && (!response || typeof response.enabled !== 'boolean')) error = new Error('权限响应格式异常');
    networkDiagnostics.permissions[path.split('?')[0]] = { kind: error ? networkFailureKind(error) : 'ok' };
    // Observe ordinary requests without starting probes or interrupting automatic retries.
  }

  function offerNetworkDiagnostics(reason, error) {
    if (networkDiagnostics.checking || networkDiagnostics.open || networkDiagnostics.offerOpen) return;
    if (networkDiagnostics.lastOfferedAt && Date.now() - networkDiagnostics.lastOfferedAt < NETWORK_DIAGNOSTICS_OFFER_COOLDOWN_MS) return;
    networkDiagnostics.reason = reason || '当前操作未能完成';
    networkDiagnostics.simulation = false;
    networkDiagnostics.runtimeFailure = Boolean(error && error.scriptRuntimeFailure);
    networkDiagnostics.runtimeComponent = String(error && error.componentKey || '');
    networkDiagnostics.lastOfferedAt = Date.now();
    networkDiagnostics.offerOpen = true;
    expandPanel();
    renderNetworkDiagnostics(ensurePanel());
  }

  function networkDiagnosticsTargets() {
    return [
      { id: 'google', label: '谷歌', url: 'https://www.google.com/generate_204' },
      { id: 'update', label: '油叉更新站', url: GREASYFORK_SCRIPT_URL },
      { id: 'cdn', label: 'Excel 等组件下载站', url: EXCELJS_URL },
      { id: 'cloud', label: '权限服务主线路', url: CLOUD_BACKUP_API_BASE + '/health', health: true },
      { id: 'fallback', label: '权限服务备用线路', url: CLOUD_ASSET_FALLBACK_API_BASE + '/health', health: true },
      ...[
        ['size-image', '尺寸图权限'], ['parameter-image', '参数图权限'],
        ['lulu-theme', '主题权限'], ['magic-upload', '魔法上传权限'],
      ].map(([feature, label]) => ({ id: 'permission-' + feature, label, permission: true, path: '/features/' + feature })),
    ];
  }

  function probeNetworkTarget(target) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (kind, status, detail) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve({ ...target, kind, status: Number(status) || 0, detail: detail || '' });
      };
      const timer = window.setTimeout(() => finish(target.permission ? 'pending-timeout' : 'unreachable'), NETWORK_DIAGNOSTICS_TIMEOUT_MS + 500);
      if (target.permission) {
        const name = findCurrentPlmUserName();
        if (!name) { finish('auth-error', 0, '未识别到 PLM 登录用户'); return; }
        cloudRequest(target.path + '?name=' + encodeURIComponent(name), { method: 'GET', timeoutMs: NETWORK_DIAGNOSTICS_TIMEOUT_MS }).then((response) => {
          if (!response || typeof response.enabled !== 'boolean') finish('invalid-response');
          else finish('ok', 200, response.enabled ? '通信正常 · 已开通' : '通信正常 · 未开通此功能');
        }, (error) => finish(networkFailureKind(error), error && error.status));
        return;
      }
      if (typeof GM_xmlhttpRequest !== 'function') { finish('unsupported'); return; }
      try {
        GM_xmlhttpRequest({
          method: target.health ? 'GET' : 'HEAD', url: target.url,
          timeout: NETWORK_DIAGNOSTICS_TIMEOUT_MS, anonymous: true,
          onload: (response) => {
            const status = Number(response.status) || 0;
            if (!status) return finish('unreachable');
            if (status < 200 || status >= 400) return finish('http-error', status);
            if (target.id === 'cdn' && /content-type:\s*text\/html/i.test(response.responseHeaders || '')) return finish('invalid-response', status);
            if (target.health) {
              try {
                if (JSON.parse(response.responseText || '{}').ok !== true) return finish('invalid-response', status);
              } catch (_) { return finish('invalid-response', status); }
            }
            finish('ok', status);
          },
          onerror: () => finish('unreachable'), ontimeout: () => finish('unreachable'), onabort: () => finish('unreachable'),
        });
      } catch (_) { finish('unsupported'); }
    });
  }

  function networkDiagnosticsConclusion() {
    const result = (kind, title, message) => ({ kind, title, message });
    if (networkDiagnostics.checking) return result('checking', '正在检测通信情况', '结果正在逐项更新，请稍等几秒。');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return result('offline', '电脑已断网', '请先连接公司网络或 Wi-Fi；仍无法联网请联系 IT。');
    const rows = networkDiagnostics.results;
    if (!rows.length) return result('unknown', '尚未检测', '点击“开始检测”，查看哪些通信失败。');
    if (rows.some((row) => row.kind === 'unsupported')) return result('browser', '浏览器阻止了网络检测', '请允许油猴跨域连接请求，或请 IT 协助检查浏览器限制。');
    const cloudOk = rows.some((row) => row.health && row.kind === 'ok');
    const permissions = rows.filter((row) => row.permission);
    const failures = rows.filter((row) => row.kind === 'unreachable' && row.id !== 'google' && (!row.health || !cloudOk));
    if (failures.length) {
      const googleOk = rows.some((row) => row.id === 'google' && row.kind === 'ok');
      return result('network', '更像梯子 / 网络问题',
        (googleOk ? '谷歌正常，但' : '') + failures.map((row) => row.label).join('、') + '连不上。请把结果发给 IT，检查梯子线路、分流和公司网络拦截。检测尚不能排除目标网站自身故障；无需反复重装脚本。');
    }
    if (permissions.some((row) => row.kind === 'auth-error')) return result('auth', '是登录或账号授权问题', '服务能响应，但登录或授权未通过。请重新登录 PLM；仍失败请联系权限管理员。');
    if (!cloudOk || rows.some((row) => row.id !== 'google' && !row.health && ['http-error', 'invalid-response'].includes(row.kind))) {
      return result('server', '服务响应异常，不能认定是梯子故障', '网站已响应，但返回错误或异常内容。请把结果发给维护人员检查服务、网络拦截或脚本与服务的兼容情况。');
    }
    if (permissions.some((row) => row.kind === 'pending-timeout')) return result('unknown', '网站可连接，权限仍未确认', '权限请求未在检测时限内完成，暂不能判断是梯子还是脚本问题。请重新检测或复制结果给维护人员。');
    const runtimeRecovered = networkDiagnostics.runtimeComponent && typeof getLazyExternalRuntime === 'function'
      && getLazyExternalRuntime(networkDiagnostics.runtimeComponent);
    if (networkDiagnostics.runtimeFailure && !runtimeRecovered) return result('script', '网络正常，更像脚本 / 浏览器兼容问题', '更新站、下载站和权限请求正常，但组件加载后没有正常运行。请把原操作报错和检测结果发给脚本维护人员。');
    return result('recovered', '助手所需通信正常', '本次检测没有发现助手所需通信故障，请重试刚才的操作。若仍失败，请把原操作报错和检测结果发给脚本维护人员；仅凭连接正常还不能断定脚本有问题。');
  }

  function networkDiagnosticsRows() {
    return networkDiagnostics.results.map((row) => ({ ...row, detail: row.detail || ({
      waiting: '检测中…', ok: '通信正常', unreachable: '通信失败 / 超时', unsupported: '浏览器阻止检测',
      'invalid-response': '响应内容异常', 'auth-error': '登录或授权失败', 'pending-timeout': '超时，暂未确认',
    }[row.kind] || '网站返回 HTTP ' + row.status) }));
  }

  function networkDiagnosticsReport() {
    const conclusion = networkDiagnosticsConclusion();
    return ['PLM 助手通信检测 · v' + SCRIPT_VERSION,
      networkDiagnostics.simulation ? '动画演示：所有结果为模拟，不代表当前网络。' : '真实通信检测',
      '受影响操作：' + (networkDiagnostics.reason || '手动检测'),
      networkDiagnostics.checkedAt ? '检测时间：' + new Date(networkDiagnostics.checkedAt).toLocaleString() : '检测尚未完成',
      conclusion.title, conclusion.message,
      ...networkDiagnosticsRows().map((row) => row.label + '：' + row.detail + (row.url ? ' · ' + row.url : '')),
    ].join('\n');
  }

  function networkDiagnosticIcon(kind) {
    // Reuse the API status spinner's CSS animation; do not rely on inline SVG SMIL.
    if (kind === 'waiting') return '<span class="pfh-api-spinner" aria-hidden="true"></span>';
    return kind === 'ok'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#e7f6ec"/><path d="m7 12 3 3 7-7" fill="none" stroke="#198447" stroke-width="2.5"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#feecec"/><path d="m8 8 8 8m0-8-8 8" stroke="#cf3c3c" stroke-width="2.5"/></svg>';
  }

  function renderNetworkDiagnostics(panel) {
    if (!panel) return;
    let layer = panel.querySelector('[data-network-diagnostics-layer]');
    if (!networkDiagnostics.open && !networkDiagnostics.offerOpen) { if (layer) layer.remove(); return; }
    const full = panel.querySelector('.pfh-full');
    if (!full) return;
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-network-layer';
      layer.setAttribute('data-network-diagnostics-layer', '1');
      full.appendChild(layer);
    }
    const header = (title) => '<header class="pfh-network-header"><div><small>连接诊断' + (networkDiagnostics.simulation ? ' · 动画演示' : '') + '</small><h3>' + escapeHtml(title) + '</h3></div><button type="button" class="pfh-network-close" data-action="network-diagnostics-close" aria-label="关闭">×</button></header>';
    if (networkDiagnostics.offerOpen && !networkDiagnostics.open) {
      layer.innerHTML = '<dialog open class="pfh-network-dialog pfh-network-offer" role="dialog" aria-label="网络波动提示">' + header('连接遇到了一点波动')
        + '<div class="pfh-network-body"><div class="pfh-network-reason"><span aria-hidden="true">!</span><p>' + escapeHtml(networkDiagnostics.reason.replace(/^动画演示：/, '')) + '</p></div>'
        + '<p class="pfh-network-description">检测一下，看看是网络连接还是服务出了问题。</p>'
        + (networkDiagnostics.simulation ? '<p class="pfh-network-demo-note">这是动画演示，不代表当前网络状态。</p>' : '') + '</div>'
        + '<footer class="pfh-network-footer"><small>约 8 秒 · 不修改设置</small><div><button type="button" class="pfh-network-secondary" data-action="network-diagnostics-close">暂不检测</button><button type="button" class="pfh-network-primary" data-action="network-diagnostics-retry">开始检测</button></div></footer></dialog>';
      return;
    }
    const conclusion = networkDiagnosticsConclusion();
    const rows = networkDiagnosticsRows();
    const finished = rows.filter((row) => row.kind !== 'waiting').length;
    const titles = { checking: '正在检查通信', recovered: '通信正常', network: '优先排查代理网络', script: '脚本运行需要排查', auth: '账号授权异常', server: '服务响应异常', offline: '当前已断网', browser: '检测被浏览器拦截', unknown: '部分结果仍待确认' };
    const summary = conclusion.kind === 'recovered' ? '连接已就绪，可以重试刚才的操作。' : networkDiagnostics.checking ? '正在逐项检查，请稍等片刻。' : '已找到异常项，展开下方建议查看处理方式。';
    const group = (label, items) => '<section class="pfh-network-group"><h4>' + label + '</h4>' + items.map((row) => {
      const status = row.kind === 'ok' ? (row.permission ? row.detail.includes('未开通') ? '未开通' : '已开通' : '正常') : row.kind === 'waiting' ? '检查中' : row.kind === 'unreachable' ? '无法连接' : row.kind === 'pending-timeout' ? '待确认' : row.detail;
      return '<div class="pfh-network-row" data-status="' + escapeHtml(row.kind) + '"><span class="pfh-network-row-icon">' + networkDiagnosticIcon(row.kind) + '</span><strong>' + escapeHtml(row.label) + '</strong><span class="pfh-network-status">' + escapeHtml(status) + '</span></div>';
    }).join('') + '</section>';
    layer.innerHTML = '<dialog open class="pfh-network-dialog" role="dialog" aria-label="通信检测结果" data-outcome="' + conclusion.kind + '">' + header(networkDiagnostics.simulation ? '演示 · 通信检测' : '通信检测')
      + '<div class="pfh-network-body" aria-busy="' + networkDiagnostics.checking + '"><div class="pfh-network-summary"><span>' + networkDiagnosticIcon(networkDiagnostics.checking ? 'waiting' : conclusion.kind === 'recovered' ? 'ok' : 'error') + '</span><div><strong>' + escapeHtml(titles[conclusion.kind] || conclusion.title) + '</strong><p>' + summary + '</p></div></div>'
      + (networkDiagnostics.simulation ? '<p class="pfh-network-demo-note">所有结果为模拟，不代表当前网络。</p>' : '')
      + '<div class="pfh-network-progress"><progress max="' + Math.max(1, rows.length) + '" value="' + finished + '" aria-label="通信检测进度"></progress><span>' + finished + ' / ' + rows.length + '</span></div>'
      + group('外部连接', rows.filter((row) => !row.permission)) + group('账号与功能', rows.filter((row) => row.permission))
      + (!networkDiagnostics.checking ? '<details class="pfh-network-advice"><summary>判断依据与处理建议</summary><p>' + escapeHtml(conclusion.message) + '</p></details>' : '') + '</div>'
      + '<footer class="pfh-network-footer"><small>' + escapeHtml(networkDiagnostics.checking ? '检测中…' : new Date(networkDiagnostics.checkedAt).toLocaleTimeString() + ' 检测') + '</small><div><button type="button" class="pfh-network-secondary" data-action="network-diagnostics-retry"' + (networkDiagnostics.checking ? ' disabled' : '') + '>重新检测</button>'
      + '<button type="button" class="pfh-network-primary" data-action="network-diagnostics-copy"' + (networkDiagnostics.checking ? ' disabled' : '') + '>复制结果</button></div></footer></dialog>';
  }

  function openNetworkDiagnosticsDemo() {
    if (networkDiagnostics.checking) return;
    networkDiagnostics.open = false;
    networkDiagnostics.offerOpen = true;
    networkDiagnostics.simulation = true;
    networkDiagnostics.runtimeFailure = false;
    networkDiagnostics.runtimeComponent = '';
    networkDiagnostics.reason = '动画演示：模拟 Excel 下载失败';
    expandPanel();
    renderNetworkDiagnostics(ensurePanel());
  }

  function requestNetworkDiagnostics(open, simulation) {
    // Consent must come from Start/Retry or the userscript menu, never a failed background request.
    if (!open) return Promise.resolve(networkDiagnostics.results);
    networkDiagnostics.offerOpen = false;
    networkDiagnostics.open = true;
    networkDiagnostics.lastOfferedAt = Date.now();
    expandPanel();
    if (networkDiagnostics.promise) { renderNetworkDiagnostics(ensurePanel()); return networkDiagnostics.promise; }
    if (!simulation && networkDiagnostics.simulation) {
      networkDiagnostics.reason = '手动真实通信检测';
      networkDiagnostics.runtimeFailure = false;
      networkDiagnostics.runtimeComponent = '';
    }
    networkDiagnostics.simulation = Boolean(simulation);
    networkDiagnostics.checking = true;
    networkDiagnostics.results = networkDiagnosticsTargets().map((target) => ({ ...target, kind: 'waiting' }));
    renderNetworkDiagnostics(ensurePanel());
    const probes = networkDiagnostics.results.map((target, index) => (networkDiagnostics.simulation
      ? new Promise((resolve) => window.setTimeout(() => resolve({ ...target,
        kind: target.id === 'google' ? 'ok' : 'unreachable', status: 0,
      }), 450 + index * 220))
      : probeNetworkTarget(target)).then((result) => {
      networkDiagnostics.results[index] = result;
      renderNetworkDiagnostics(ensurePanel());
      return result;
    }));
    networkDiagnostics.promise = Promise.all(probes).then((results) => {
      networkDiagnostics.checkedAt = Date.now();
      return results;
    }).finally(() => {
      networkDiagnostics.checking = false;
      networkDiagnostics.promise = null;
      renderNetworkDiagnostics(ensurePanel());
    });
    return networkDiagnostics.promise;
  }
