
  // Ledger canvas: a read-only stage map of today's ledger records. Ledger data
  // only flows in; every interaction (node drag, pan, zoom, manual note nodes,
  // links) writes exclusively to the local canvas layout key below, never to
  // the daily ledger. The canvas root is created per render and destroyed with
  // the tab content, so all listeners live on the root or its children only.

  const LEDGER_CANVAS_LAYOUT_KEY = 'plm-floating-helper:ledger-canvas-layout:v1';
  const LEDGER_CANVAS_STYLE_ID = 'plm-floating-helper-ledger-canvas-style';
  const LEDGER_CANVAS_SCALE_MIN = 0.4;
  const LEDGER_CANVAS_SCALE_MAX = 2;
  const LEDGER_CANVAS_MAX_POSITIONS = 500;
  const LEDGER_CANVAS_MAX_MANUAL_NODES = 100;
  const LEDGER_CANVAS_MAX_TASK_NODES = 200;
  const LEDGER_CANVAS_MAX_MANUAL_LINKS = 32;
  const LEDGER_CANVAS_LANE_X = [40, 360, 680];
  const LEDGER_CANVAS_NODE_WIDTH = 216;
  const LEDGER_CANVAS_TASK_TOP = 96;
  const LEDGER_CANVAS_TASK_PITCH = 112;
  const LEDGER_CANVAS_WORLD_MIN_HEIGHT = 1240;
  const LEDGER_CANVAS_WORLD_MAX_HEIGHT = 6400;
  const LEDGER_CANVAS_SAVE_DEBOUNCE_MS = 400;
  const LEDGER_CANVAS_DELETE_ARM_MS = 2600;
  const LEDGER_CANVAS_NODE_HEIGHTS = { lane: 44, task: 112, note: 172, step: 60 };

  const LEDGER_CANVAS_CSS = [
    '#plm-floating-helper .pfh-canvas-root{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;box-sizing:border-box;padding:0 2px 4px;}',
    '#plm-floating-helper .pfh-canvas-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:6px;flex:0 0 auto;padding:6px 8px;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:12px;background:var(--pfh-theme-surface,#fff);}',
    '#plm-floating-helper .pfh-canvas-toolbar strong{font-size:12px;color:var(--pfh-theme-text,#1f2937);margin-right:2px;}',
    '#plm-floating-helper .pfh-canvas-toolbar button{min-height:28px;padding:0 10px;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:8px;background:var(--pfh-theme-control-surface,#f7f8fc);color:var(--pfh-theme-text,#1f2937);font:inherit;font-size:11px;line-height:1;cursor:pointer;transition:border-color .18s ease,background .18s ease,color .18s ease;}',
    '#plm-floating-helper .pfh-canvas-toolbar button:hover{border-color:var(--pfh-theme-primary,#7c3aed);color:var(--pfh-theme-primary,#7c3aed);background:var(--pfh-theme-primary-soft,#f3efff);}',
    '#plm-floating-helper .pfh-canvas-hint{font-size:10px;line-height:1.4;color:var(--pfh-theme-muted,#64748b);}',
    '#plm-floating-helper .pfh-canvas-link-hint{margin-left:auto;font-size:10px;line-height:1.4;color:var(--pfh-theme-primary,#7c3aed);}',
    '#plm-floating-helper .pfh-canvas-viewport{position:relative;flex:1 1 auto;min-height:0;margin-top:6px;overflow:hidden;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:12px;background:linear-gradient(135deg,var(--pfh-theme-surface,#fff),var(--pfh-theme-surface-alt,#f7f8fc));box-shadow:inset 0 1px 0 rgba(255,255,255,.86);transform-origin:0 0;touch-action:none;cursor:grab;}',
    '#plm-floating-helper .pfh-canvas-viewport.is-panning{cursor:grabbing;}',
    '#plm-floating-helper .pfh-canvas-edges{position:absolute;left:0;top:0;overflow:visible;pointer-events:none;}',
    '#plm-floating-helper .pfh-canvas-nodes{position:absolute;left:0;top:0;pointer-events:none;}',
    '#plm-floating-helper .pfh-canvas-node{position:absolute;pointer-events:auto;display:flex;flex-direction:column;box-sizing:border-box;width:216px;padding:8px 10px;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:12px;background:var(--pfh-theme-surface,#fff);color:var(--pfh-theme-text,#1f2937);box-shadow:0 6px 16px var(--pfh-theme-shadow-soft,rgba(91,62,180,.10));font-size:11px;line-height:1.45;}',
    '#plm-floating-helper .pfh-canvas-node.is-lane{flex-direction:row;align-items:center;justify-content:space-between;min-height:44px;padding:6px 12px;border-radius:999px;font-size:12px;}',
    '#plm-floating-helper .pfh-canvas-node.is-lane .pfh-canvas-lane-title{font-weight:700;}',
    '#plm-floating-helper .pfh-canvas-node.is-lane .pfh-canvas-lane-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 6px;border-radius:999px;background:var(--pfh-theme-primary-soft,#f3efff);color:var(--pfh-theme-primary,#7c3aed);font-variant-numeric:tabular-nums;}',
    '#plm-floating-helper .pfh-canvas-node.is-lane.is-stage-pending{border-color:var(--pfh-theme-border-strong,#b7a6f4);}',
    '#plm-floating-helper .pfh-canvas-node.is-lane.is-stage-generated{border-color:var(--pfh-theme-primary,#7c3aed);background:linear-gradient(135deg,var(--pfh-theme-primary-soft,#f3efff),var(--pfh-theme-surface,#fff));}',
    '#plm-floating-helper .pfh-canvas-node.is-lane.is-stage-finalized{border-color:var(--pfh-theme-secondary,#60a878);background:linear-gradient(135deg,var(--pfh-theme-secondary-soft,#eefaf1),var(--pfh-theme-surface,#fff));}',
    '#plm-floating-helper .pfh-canvas-node.is-task{cursor:grab;}',
    '#plm-floating-helper .pfh-canvas-node.is-stage-pending{border-left:3px solid var(--pfh-theme-border-strong,#b7a6f4);}',
    '#plm-floating-helper .pfh-canvas-node.is-stage-generated{border-left:3px solid var(--pfh-theme-primary,#7c3aed);background:linear-gradient(135deg,var(--pfh-theme-primary-soft,#f3efff),var(--pfh-theme-surface,#fff));}',
    '#plm-floating-helper .pfh-canvas-node.is-stage-finalized{border-left:3px solid var(--pfh-theme-secondary,#60a878);background:linear-gradient(135deg,var(--pfh-theme-surface,#fff),var(--pfh-theme-secondary-soft,#eefaf1));}',
    '#plm-floating-helper .pfh-canvas-node.is-dragging{box-shadow:0 14px 34px var(--pfh-theme-shadow-soft,rgba(91,62,180,.22));opacity:.92;}',
    '#plm-floating-helper .pfh-canvas-node-head{display:flex;align-items:center;gap:6px;min-height:20px;cursor:grab;}',
    '#plm-floating-helper .pfh-canvas-node-head b{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}',
    '#plm-floating-helper .pfh-canvas-node-sku{align-self:flex-start;max-width:130px;margin-top:4px;padding:0 7px;overflow:hidden;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:999px;background:var(--pfh-theme-control-surface,#f7f8fc);color:var(--pfh-theme-primary,#7c3aed);font:inherit;font-size:10px;line-height:19px;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;}',
    '#plm-floating-helper .pfh-canvas-node-badges{display:flex;align-items:flex-start;flex-wrap:wrap;gap:4px;margin-top:5px;}',
    '#plm-floating-helper .pfh-canvas-node-badges-list{display:flex;flex-wrap:wrap;gap:4px;min-width:0;}',
    '#plm-floating-helper .pfh-canvas-node-badges-list span{max-width:120px;overflow:hidden;padding:1px 7px;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:999px;background:var(--pfh-theme-surface-alt,#f7f8fc);color:var(--pfh-theme-muted,#64748b);font-size:9px;line-height:1.5;text-overflow:ellipsis;white-space:nowrap;}',
    '#plm-floating-helper .pfh-canvas-node-stage{flex:0 0 auto;padding:1px 7px;border-radius:999px;background:var(--pfh-theme-surface-alt,#f7f8fc);color:var(--pfh-theme-text,#1f2937);font-weight:700;}',
    '#plm-floating-helper .pfh-canvas-node.is-manual .pfh-canvas-note-title,',
    '#plm-floating-helper .pfh-canvas-node.is-manual .pfh-canvas-note-text{width:100%;min-width:0;box-sizing:border-box;padding:4px 8px;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:8px;background:var(--pfh-theme-control-surface,#f7f8fc);color:var(--pfh-theme-text,#1f2937);font:inherit;font-size:11px;line-height:1.5;}',
    '#plm-floating-helper .pfh-canvas-node.is-manual .pfh-canvas-note-text{margin-top:5px;min-height:64px;resize:none;}',
    '#plm-floating-helper .pfh-canvas-node.is-manual.is-note{min-height:172px;}',
    '#plm-floating-helper .pfh-canvas-node.is-manual.is-step{min-height:60px;}',
    '#plm-floating-helper .pfh-canvas-node-delete{flex:0 0 auto;display:grid;place-items:center;width:22px;height:22px;padding:0;border:1px solid var(--pfh-theme-border,#ddd6ef);border-radius:7px;background:var(--pfh-theme-surface,#fff);color:var(--pfh-theme-muted,#64748b);font:inherit;font-size:12px;line-height:1;cursor:pointer;}',
    '#plm-floating-helper .pfh-canvas-node-delete:hover{border-color:#d98c8c;color:#b34a5d;}',
    '#plm-floating-helper .pfh-canvas-node-delete.is-armed{border-color:#d98c8c;background:#fff2f4;color:#b34a5d;font-size:10px;}',
    '#plm-floating-helper .pfh-canvas-link-handle{position:absolute;right:10px;bottom:-9px;display:grid;place-items:center;width:18px;height:18px;border-radius:50%;border:1px solid var(--pfh-theme-primary,#7c3aed);background:var(--pfh-theme-surface,#fff);color:var(--pfh-theme-primary,#7c3aed);font-size:9px;line-height:1;cursor:crosshair;}',
    '#plm-floating-helper .pfh-canvas-link-handle:hover{background:var(--pfh-theme-primary-soft,#f3efff);}',
    '#plm-floating-helper .pfh-canvas-edge{fill:none;stroke:var(--pfh-theme-border-strong,#b7a6f4);stroke-width:1.6;}',
    '#plm-floating-helper .pfh-canvas-edge.is-dashed{stroke-dasharray:5 4;stroke:var(--pfh-theme-muted,#8a94ae);}',
    '#plm-floating-helper .pfh-canvas-edge-preview{fill:none;stroke:var(--pfh-theme-primary,#7c3aed);stroke-width:1.6;stroke-dasharray:6 4;}',
    '#plm-floating-helper .pfh-canvas-root.is-link-mode .pfh-canvas-node{cursor:crosshair;}',
    '@media (prefers-reduced-motion: reduce) {',
    '  #plm-floating-helper .pfh-canvas-node,',
    '  #plm-floating-helper .pfh-canvas-toolbar button { transition: none; }',
    '}',
  ].join('\n');

  function ensureLedgerCanvasStyles() {
    if (document.getElementById(LEDGER_CANVAS_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = LEDGER_CANVAS_STYLE_ID;
    style.textContent = LEDGER_CANVAS_CSS;
    document.documentElement.appendChild(style);
  }

  function ledgerCanvasRuntimeState() {
    return { session: null, pendingRefresh: false, layout: null, saveTimer: 0, deleteArm: null, linkMode: null };
  }

  function ledgerCanvasClampScale(value) {
    const scale = Number(value);
    if (!Number.isFinite(scale) || scale <= 0) return 1;
    return Math.min(LEDGER_CANVAS_SCALE_MAX, Math.max(LEDGER_CANVAS_SCALE_MIN, scale));
  }

  function ledgerCanvasDefaultLayout() {
    return { version: 1, updatedAtMs: 0, viewport: { x: 0, y: 0, scale: 1 }, positions: {}, manualNodes: [] };
  }

  function ledgerCanvasNormalizeManualNode(value) {
    const source = value && typeof value === 'object' ? value : {};
    // Unknown fields pass through so older saves keep round-tripping.
    const node = { ...source };
    node.id = String(source.id || '').slice(0, 80);
    node.kind = source.kind === 'step' ? 'step' : 'note';
    node.title = String(source.title || '').slice(0, 40);
    node.note = String(source.note || '').slice(0, 240);
    node.x = Number.isFinite(Number(source.x)) ? Number(source.x) : null;
    node.y = Number.isFinite(Number(source.y)) ? Number(source.y) : null;
    node.createdAtMs = Number(source.createdAtMs) || 0;
    node.links = Array.isArray(source.links)
      ? Array.from(new Set(source.links.map((link) => String(link || '').slice(0, 120)).filter(Boolean))).slice(0, LEDGER_CANVAS_MAX_MANUAL_LINKS)
      : [];
    return node;
  }

  function ledgerCanvasNormalizeLayout(value) {
    const source = value && typeof value === 'object' ? value : {};
    const layout = { ...source };
    layout.version = 1;
    layout.updatedAtMs = Number(source.updatedAtMs) || 0;
    const viewport = source.viewport && typeof source.viewport === 'object' ? source.viewport : {};
    layout.viewport = { x: Number(viewport.x) || 0, y: Number(viewport.y) || 0, scale: ledgerCanvasClampScale(viewport.scale) };
    const positions = {};
    if (source.positions && typeof source.positions === 'object' && !Array.isArray(source.positions)) {
      Object.keys(source.positions).slice(0, LEDGER_CANVAS_MAX_POSITIONS).forEach((id) => {
        const point = source.positions[id];
        if (!point || typeof point !== 'object') return;
        const x = Number(point.x);
        const y = Number(point.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        positions[String(id).slice(0, 120)] = { x, y };
      });
    }
    layout.positions = positions;
    layout.manualNodes = (Array.isArray(source.manualNodes) ? source.manualNodes : [])
      .map(ledgerCanvasNormalizeManualNode)
      .filter((node) => node.id)
      .slice(0, LEDGER_CANVAS_MAX_MANUAL_NODES);
    return layout;
  }

  function loadLedgerCanvasLayout() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(LEDGER_CANVAS_LAYOUT_KEY, null)
        : JSON.parse(localStorage.getItem(LEDGER_CANVAS_LAYOUT_KEY) || 'null');
      return ledgerCanvasNormalizeLayout(saved || ledgerCanvasDefaultLayout());
    } catch (error) {
      return ledgerCanvasDefaultLayout();
    }
  }

  function saveLedgerCanvasLayout(layout, validNodeIds) {
    const normalized = ledgerCanvasNormalizeLayout(layout || {});
    if (validNodeIds) {
      const keep = validNodeIds instanceof Set ? validNodeIds : new Set(Array.isArray(validNodeIds) ? validNodeIds : []);
      Object.keys(normalized.positions).forEach((id) => {
        if (!keep.has(id)) delete normalized.positions[id];
      });
    }
    normalized.updatedAtMs = Date.now();
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LEDGER_CANVAS_LAYOUT_KEY, normalized);
      else localStorage.setItem(LEDGER_CANVAS_LAYOUT_KEY, JSON.stringify(normalized));
    } catch (error) {
      // Layout persistence is optional; the canvas keeps working in memory.
    }
    return normalized;
  }

  // ---- Pure model helpers (self-contained so node:vm checks can drive them) ----

  function ledgerCanvasParseTimeMs(value) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function ledgerCanvasTaskId(record) {
    const text = String(record && record.date || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const date = match ? [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-') : text.slice(0, 10);
    return 'task:' + date + '::' + String(record && record.sku || '').slice(0, 80);
  }

  function ledgerCanvasRecordStage(record) {
    if (!record) return 'pending';
    if (Boolean(record.finalizedAt) || record.status === '作废') return 'finalized';
    if (Boolean(record.imageGeneratedAt)) return 'generated';
    return 'pending';
  }

  function ledgerCanvasStageLabel(stage) {
    return stage === 'finalized' ? '已定稿' : (stage === 'generated' ? '已出图' : '待出图');
  }

  function ledgerCanvasNodeHeight(kind) {
    return LEDGER_CANVAS_NODE_HEIGHTS[kind] || 112;
  }

  function buildLedgerCanvasModel(records, layout) {
    const normalizedLayout = ledgerCanvasNormalizeLayout(layout || {});
    const source = Array.isArray(records) ? records : [];
    const lanes = [
      { id: 'lane-pending', stage: 'pending', title: '待出图', x: LEDGER_CANVAS_LANE_X[0], y: 0, count: 0 },
      { id: 'lane-generated', stage: 'generated', title: '已出图', x: LEDGER_CANVAS_LANE_X[1], y: 0, count: 0 },
      { id: 'lane-finalized', stage: 'finalized', title: '已定稿', x: LEDGER_CANVAS_LANE_X[2], y: 0, count: 0 },
    ];
    const edges = [
      { from: 'lane-pending', to: 'lane-generated' },
      { from: 'lane-generated', to: 'lane-finalized' },
    ];
    const buckets = { pending: [], generated: [], finalized: [] };
    const seenIds = new Set();
    source.forEach((record) => {
      if (!record || !record.sku) return;
      const id = ledgerCanvasTaskId(record);
      if (seenIds.has(id)) return;
      seenIds.add(id);
      const stage = ledgerCanvasRecordStage(record);
      const timeMs = stage === 'finalized'
        ? (Number(record.finalizedAtMs) || ledgerCanvasParseTimeMs(record.finalizedAt) || Number(record.updatedAtMs) || ledgerCanvasParseTimeMs(record.createdAt))
        : (stage === 'generated'
          ? (Number(record.imageGeneratedAtMs) || ledgerCanvasParseTimeMs(record.imageGeneratedAt) || ledgerCanvasParseTimeMs(record.createdAt))
          : (Number(record.designAssignedAtMs) || ledgerCanvasParseTimeMs(record.designAssignedAt) || Number(record.createdAtMs) || ledgerCanvasParseTimeMs(record.createdAt)));
      buckets[stage].push({ record, timeMs });
    });
    Object.keys(buckets).forEach((stage) => {
      buckets[stage].sort((a, b) => (a.timeMs - b.timeMs) || String(a.record.sku).localeCompare(String(b.record.sku)));
      lanes.find((lane) => lane.stage === stage).count = buckets[stage].length;
    });
    const nodes = [];
    const offsets = { pending: 0, generated: 0, finalized: 0 };
    let truncatedCount = 0;
    ['pending', 'generated', 'finalized'].forEach((stage) => {
      const laneX = LEDGER_CANVAS_LANE_X[stage === 'pending' ? 0 : (stage === 'generated' ? 1 : 2)];
      buckets[stage].forEach((entry) => {
        if (nodes.length >= LEDGER_CANVAS_MAX_TASK_NODES) {
          truncatedCount += 1;
          return;
        }
        const record = entry.record;
        const id = ledgerCanvasTaskId(record);
        const override = normalizedLayout.positions[id];
        nodes.push({
          id,
          kind: 'task',
          stage,
          manual: false,
          x: override ? override.x : laneX,
          y: override ? override.y : LEDGER_CANVAS_TASK_TOP + offsets[stage] * LEDGER_CANVAS_TASK_PITCH,
          title: [record.brand, record.name].filter(Boolean).join(' ') || record.sku,
          sub: record.sku,
          badges: [record.designType, record.artPriority].filter(Boolean).slice(0, 3),
        });
        offsets[stage] += 1;
        if (stage === 'pending') edges.push({ from: id, to: 'lane-generated' });
        else if (stage === 'generated') edges.push({ from: id, to: 'lane-finalized' });
        else edges.push({ from: 'lane-finalized', to: id });
      });
    });
    // Manual note/step nodes: entries without a saved position stack near the
    // first lane, staggered so several unplaced nodes never fully overlap.
    let stackIndex = 0;
    const manualIds = new Set();
    normalizedLayout.manualNodes.forEach((manual) => {
      if (manualIds.has(manual.id)) return;
      manualIds.add(manual.id);
      const placed = Number.isFinite(manual.x) && Number.isFinite(manual.y);
      nodes.push({
        id: manual.id,
        kind: manual.kind,
        stage: 'manual',
        manual: true,
        title: manual.title,
        note: manual.note,
        links: manual.links,
        x: placed ? manual.x : 240 + stackIndex * 24,
        y: placed ? manual.y : 240 + stackIndex * 24,
      });
      if (!placed) stackIndex += 1;
    });
    const nodeIds = new Set(Array.from(manualIds).concat(nodes.filter((node) => node.kind === 'task').map((node) => node.id)));
    normalizedLayout.manualNodes.forEach((manual) => {
      (manual.links || []).forEach((target) => {
        if (target === manual.id || !nodeIds.has(target)) return;
        edges.push({ from: manual.id, to: target, dashed: true });
      });
    });
    const maxY = nodes.reduce((max, node) => Math.max(max, (Number(node.y) || 0) + ledgerCanvasNodeHeight(node.kind)), LEDGER_CANVAS_TASK_TOP + LEDGER_CANVAS_TASK_PITCH);
    const world = {
      width: LEDGER_CANVAS_LANE_X[2] + LEDGER_CANVAS_NODE_WIDTH + 48,
      height: Math.min(LEDGER_CANVAS_WORLD_MAX_HEIGHT, Math.max(LEDGER_CANVAS_WORLD_MIN_HEIGHT, maxY + 96)),
    };
    return { lanes, nodes, edges, truncatedCount, world };
  }

  // ---- Data intake (read-only) ----

  function collectLedgerCanvasRecords() {
    const today = getTodayKey();
    const month = getCurrentLedgerMonth();
    const combined = [];
    const seen = new Set();
    const push = (record, dateKey) => {
      if (!record) return;
      if (normalizeLedgerDate(dateKey) !== today) return;
      const key = ledgerCanvasTaskId(record);
      if (seen.has(key)) return;
      seen.add(key);
      combined.push(record);
    };
    getLedgerRecordsForMonth('design', month).forEach((record) => push(record, getLedgerDesignDate(record)));
    getLedgerRecordsForMonth('finalized', month).forEach((record) => push(record, getLedgerFinalizedDate(record)));
    return combined;
  }

  function ledgerCanvasRecordCountLabel(month) {
    return collectLedgerCanvasRecords().length + ' 条 / ' + month;
  }

  function ledgerCanvasCurrentModel() {
    state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    if (!state.ledgerCanvas.layout) state.ledgerCanvas.layout = loadLedgerCanvasLayout();
    return buildLedgerCanvasModel(collectLedgerCanvasRecords(), state.ledgerCanvas.layout);
  }

  // ---- Rendering ----

  function ledgerCanvasEdgePath(x1, y1, x2, y2) {
    const bend = Math.max(28, Math.min(90, Math.abs(y2 - y1) / 2));
    const round = (value) => Math.round(value * 10) / 10;
    return 'M ' + round(x1) + ' ' + round(y1) + ' C ' + round(x1) + ' ' + round(y1 + bend) + ', ' + round(x2) + ' ' + round(y2 - bend) + ', ' + round(x2) + ' ' + round(y2);
  }

  function ledgerCanvasAnchorFor(node, end) {
    const kind = node.kind === 'task' ? 'task' : (node.manual ? node.kind : 'lane');
    return {
      x: (Number(node.x) || 0) + LEDGER_CANVAS_NODE_WIDTH / 2,
      y: (Number(node.y) || 0) + (end === 'bottom' ? ledgerCanvasNodeHeight(kind) : 0),
    };
  }

  function ledgerCanvasEdgePathsHtml(model) {
    const byId = new Map();
    model.lanes.forEach((lane) => byId.set(lane.id, { id: lane.id, kind: 'lane', x: lane.x, y: lane.y, manual: false }));
    model.nodes.forEach((node) => byId.set(node.id, node));
    return model.edges.map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return '';
      const start = ledgerCanvasAnchorFor(from, 'bottom');
      const end = ledgerCanvasAnchorFor(to, 'top');
      return '<path class="pfh-canvas-edge' + (edge.dashed ? ' is-dashed' : '') + '" d="' + ledgerCanvasEdgePath(start.x, start.y, end.x, end.y) + '"/>';
    }).join('');
  }

  function ledgerCanvasLaneHtml(lane) {
    return '<div class="pfh-canvas-node is-lane is-stage-' + lane.stage + '" data-canvas-node-id="' + escapeHtml(lane.id) + '" data-canvas-kind="lane" data-canvas-lane="' + escapeHtml(lane.stage) + '" style="left:' + lane.x + 'px;top:' + lane.y + 'px;">'
      + '<span class="pfh-canvas-lane-title">' + escapeHtml(lane.title) + '</span>'
      + '<span class="pfh-canvas-lane-count" data-canvas-lane-count="' + lane.stage + '">' + escapeHtml(String(lane.count)) + '</span>'
      + '</div>';
  }

  function ledgerCanvasTaskNodeHtml(node) {
    return '<div class="pfh-canvas-node is-task is-stage-' + node.stage + '" data-canvas-node-id="' + escapeHtml(node.id) + '" data-canvas-kind="task" data-canvas-draggable="1" style="left:' + node.x + 'px;top:' + node.y + 'px;">'
      + '<div class="pfh-canvas-node-head"><b title="' + escapeHtml(node.title) + '">' + escapeHtml(node.title) + '</b></div>'
      + '<button type="button" class="pfh-canvas-node-sku" data-action="ledger-open-sku" data-sku="' + escapeHtml(node.sub) + '" title="打开 SKU 详情">' + escapeHtml(node.sub) + '</button>'
      + '<div class="pfh-canvas-node-badges"><span class="pfh-canvas-node-badges-list" data-canvas-node-badges>' + node.badges.map((badge) => '<span>' + escapeHtml(badge) + '</span>').join('') + '</span><span class="pfh-canvas-node-stage" data-canvas-node-stage>' + ledgerCanvasStageLabel(node.stage) + '</span></div>'
      + '</div>';
  }

  function ledgerCanvasManualNodeHtml(node) {
    const isNote = node.kind === 'note';
    return '<div class="pfh-canvas-node is-manual is-' + node.kind + '" data-canvas-node-id="' + escapeHtml(node.id) + '" data-canvas-kind="' + node.kind + '" data-canvas-draggable="1" data-canvas-manual="1" style="left:' + node.x + 'px;top:' + node.y + 'px;">'
      + '<div class="pfh-canvas-node-head">'
        + '<input type="text" class="pfh-canvas-note-title" data-canvas-note-title maxlength="40" value="' + escapeHtml(node.title) + '" placeholder="备注标题" aria-label="备注标题">'
        + '<button type="button" class="pfh-canvas-node-delete" data-action="canvas-delete-node" title="删除节点">✕</button>'
      + '</div>'
      + (isNote ? '<textarea class="pfh-canvas-note-text" data-canvas-note-text maxlength="240" rows="3" placeholder="写点备注（240 字内）" aria-label="备注内容">' + escapeHtml(node.note) + '</textarea>' : '')
      + '<span class="pfh-canvas-link-handle" data-canvas-link-handle title="拖到其他节点连线">●</span>'
      + '</div>';
  }

  function ledgerCanvasNodeHtml(node) {
    if (node.kind === 'task') return ledgerCanvasTaskNodeHtml(node);
    return ledgerCanvasManualNodeHtml(node);
  }

  function ledgerCanvasViewHtml() {
    ensureLedgerCanvasStyles();
    const model = ledgerCanvasCurrentModel();
    return '<div class="pfh-canvas-root" data-canvas-root="1">'
      + '<div class="pfh-canvas-toolbar">'
        + '<strong>今日画布</strong>'
        + '<button type="button" data-action="canvas-add-node">加节点</button>'
        + '<button type="button" data-action="canvas-refresh">刷新</button>'
        + '<button type="button" data-action="canvas-reset-zoom">缩放复位</button>'
        + '<button type="button" data-action="canvas-reset-layout">布局复位</button>'
        + '<span class="pfh-canvas-hint" data-canvas-hint>' + (model.truncatedCount ? '另有 ' + model.truncatedCount + ' 条未展示' : '') + '</span>'
        + '<span class="pfh-canvas-link-hint" data-canvas-link-hint hidden>连线中：点击目标节点完成连线，点空白处取消</span>'
      + '</div>'
      + '<div class="pfh-canvas-viewport">'
        + '<svg class="pfh-canvas-edges" width="' + model.world.width + '" height="' + model.world.height + '" viewBox="0 0 ' + model.world.width + ' ' + model.world.height + '" aria-hidden="true" focusable="false">' + ledgerCanvasEdgePathsHtml(model) + '</svg>'
        + '<div class="pfh-canvas-nodes" style="width:' + model.world.width + 'px;height:' + model.world.height + 'px;">'
          + model.lanes.map(ledgerCanvasLaneHtml).join('')
          + model.nodes.map(ledgerCanvasNodeHtml).join('')
        + '</div>'
      + '</div>'
      + '</div>';
  }

  // ---- In-place refresh (id-aligned; never destroys the root or listeners) ----

  function ledgerCanvasCreateNodeElement(node) {
    const host = document.createElement('div');
    host.innerHTML = ledgerCanvasNodeHtml(node);
    return host.firstChild;
  }

  function ledgerCanvasUpdateNodeElement(el, node) {
    el.classList.toggle('is-stage-pending', node.stage === 'pending');
    el.classList.toggle('is-stage-generated', node.stage === 'generated');
    el.classList.toggle('is-stage-finalized', node.stage === 'finalized');
    el.classList.toggle('is-manual', Boolean(node.manual));
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    if (node.kind !== 'task') return;
    const head = el.querySelector('.pfh-canvas-node-head b');
    if (head) {
      head.textContent = node.title;
      head.setAttribute('title', node.title);
    }
    const sku = el.querySelector('[data-action="ledger-open-sku"]');
    if (sku) {
      sku.textContent = node.sub;
      sku.setAttribute('data-sku', node.sub);
    }
    const badges = el.querySelector('[data-canvas-node-badges]');
    if (badges) badges.innerHTML = node.badges.map((badge) => '<span>' + escapeHtml(badge) + '</span>').join('');
    const stageLabel = el.querySelector('[data-canvas-node-stage]');
    if (stageLabel) stageLabel.textContent = ledgerCanvasStageLabel(node.stage);
  }

  function refreshLedgerCanvasData(root) {
    if (!root || !root.isConnected) return false;
    const runtime = state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    // A pointer session is in flight: defer the rebuild to the pointerup
    // handler so an in-progress drag/pan/zoom is never torn down.
    if (runtime.session) {
      runtime.pendingRefresh = true;
      return true;
    }
    if (!runtime.layout) runtime.layout = loadLedgerCanvasLayout();
    const nodesLayer = root.querySelector('.pfh-canvas-nodes');
    const edgesSvg = root.querySelector('.pfh-canvas-edges');
    if (!nodesLayer || !edgesSvg) return false;
    const model = buildLedgerCanvasModel(collectLedgerCanvasRecords(), runtime.layout);
    model.lanes.forEach((lane) => {
      const laneEl = nodesLayer.querySelector('[data-canvas-lane="' + lane.stage + '"]');
      if (!laneEl) return;
      const count = laneEl.querySelector('[data-canvas-lane-count]');
      if (count) count.textContent = String(lane.count);
    });
    const existing = new Map();
    nodesLayer.querySelectorAll('[data-canvas-node-id]').forEach((el) => {
      if (el.getAttribute('data-canvas-kind') === 'lane') return;
      existing.set(el.getAttribute('data-canvas-node-id'), el);
    });
    const keepIds = new Set();
    model.nodes.forEach((node) => {
      keepIds.add(node.id);
      const el = existing.get(node.id);
      if (el) ledgerCanvasUpdateNodeElement(el, node);
      else nodesLayer.appendChild(ledgerCanvasCreateNodeElement(node));
    });
    existing.forEach((el, id) => {
      if (!keepIds.has(id)) el.remove();
    });
    edgesSvg.innerHTML = ledgerCanvasEdgePathsHtml(model);
    edgesSvg.setAttribute('width', String(model.world.width));
    edgesSvg.setAttribute('height', String(model.world.height));
    edgesSvg.setAttribute('viewBox', '0 0 ' + model.world.width + ' ' + model.world.height);
    const hint = root.querySelector('[data-canvas-hint]');
    if (hint) hint.textContent = model.truncatedCount ? '另有 ' + model.truncatedCount + ' 条未展示' : '';
    return true;
  }

  // ---- Viewport transform helpers ----

  function applyLedgerCanvasViewportTransform(viewport, viewportState) {
    if (!viewport) return;
    const scale = ledgerCanvasClampScale(viewportState && viewportState.scale);
    const x = Math.round(Number(viewportState && viewportState.x) || 0);
    const y = Math.round(Number(viewportState && viewportState.y) || 0);
    viewport.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')';
  }

  function ledgerCanvasViewportOrigin(root) {
    const viewport = root.querySelector('.pfh-canvas-viewport');
    const rect = root.getBoundingClientRect();
    return {
      x: rect.left + (viewport ? viewport.offsetLeft : 0),
      y: rect.top + (viewport ? viewport.offsetTop : 0),
    };
  }

  function ledgerCanvasClientToWorld(root, clientX, clientY) {
    const runtime = state.ledgerCanvas;
    const vp = runtime && runtime.layout ? runtime.layout.viewport : { x: 0, y: 0, scale: 1 };
    const scale = ledgerCanvasClampScale(vp.scale);
    const origin = ledgerCanvasViewportOrigin(root);
    return { x: (clientX - origin.x - vp.x) / scale, y: (clientY - origin.y - vp.y) / scale };
  }

  function ledgerCanvasViewportCenterWorld(root) {
    const viewport = root.querySelector('.pfh-canvas-viewport');
    const runtime = state.ledgerCanvas;
    const vp = runtime && runtime.layout ? runtime.layout.viewport : { x: 0, y: 0, scale: 1 };
    const scale = ledgerCanvasClampScale(vp.scale);
    const width = viewport ? viewport.offsetWidth : 600;
    const height = viewport ? viewport.offsetHeight : 420;
    return {
      x: Math.max(0, Math.round((width / 2 - vp.x) / scale - LEDGER_CANVAS_NODE_WIDTH / 2)),
      y: Math.max(0, Math.round((height / 2 - vp.y) / scale - 60)),
    };
  }

  function ledgerCanvasNodeAnchorById(root, id, end) {
    const el = root.querySelector('[data-canvas-node-id="' + cssEscape(id) + '"]');
    if (!el) return { x: 0, y: 0 };
    const kind = el.getAttribute('data-canvas-kind') || 'task';
    return {
      x: (Number.parseFloat(el.style.left) || 0) + LEDGER_CANVAS_NODE_WIDTH / 2,
      y: (Number.parseFloat(el.style.top) || 0) + (end === 'bottom' ? ledgerCanvasNodeHeight(kind) : 0),
    };
  }

  // ---- Persistence ----

  function persistLedgerCanvasLayout(root) {
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    // Prune stale positions only against a live root; a save after the canvas
    // closed must never wipe the dragged positions it can no longer verify.
    let validNodeIds = null;
    if (root && root.isConnected) {
      validNodeIds = new Set();
      root.querySelectorAll('[data-canvas-draggable]').forEach((el) => {
        if (el.getAttribute('data-canvas-manual') !== '1') validNodeIds.add(el.getAttribute('data-canvas-node-id'));
      });
    }
    runtime.layout = saveLedgerCanvasLayout(runtime.layout, validNodeIds);
  }

  function scheduleLedgerCanvasLayoutSave() {
    const runtime = state.ledgerCanvas;
    if (!runtime) return;
    if (runtime.saveTimer) window.clearTimeout(runtime.saveTimer);
    runtime.saveTimer = window.setTimeout(() => {
      runtime.saveTimer = 0;
      const root = document.querySelector('.pfh-canvas-root');
      persistLedgerCanvasLayout(root && root.isConnected ? root : null);
    }, LEDGER_CANVAS_SAVE_DEBOUNCE_MS);
  }

  // Manual nodes saved without coordinates (corrupt or hand-edited storage)
  // land at the viewport center, staggered so several never fully overlap.
  function placeUnplacedLedgerCanvasManualNodes(root) {
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    const pending = runtime.layout.manualNodes.filter((node) => node.x == null || node.y == null);
    if (!pending.length) return;
    const center = ledgerCanvasViewportCenterWorld(root);
    pending.forEach((node, index) => {
      node.x = center.x + index * 24;
      node.y = center.y + index * 24;
    });
    persistLedgerCanvasLayout(root);
    refreshLedgerCanvasData(root);
  }

  // ---- Pointer sessions (bound to the canvas root only) ----

  function handleLedgerCanvasPointerDown(event) {
    const root = event.currentTarget;
    if (!root || !root.isConnected || event.button !== 0) return;
    const runtime = state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    if (!runtime.layout) runtime.layout = loadLedgerCanvasLayout();
    if (runtime.session) return;
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (runtime.linkMode) {
      const modeNode = target.closest('[data-canvas-node-id]');
      const fromId = runtime.linkMode.fromId;
      runtime.linkMode = null;
      updateLedgerCanvasLinkModeHint(root);
      if (modeNode && modeNode.getAttribute('data-canvas-node-id') !== fromId) {
        toggleLedgerCanvasManualLink(root, fromId, modeNode.getAttribute('data-canvas-node-id'));
      }
      return;
    }
    if (target.closest('button, input, textarea, select, [data-canvas-no-drag]')) return;
    const nodeEl = target.closest('[data-canvas-node-id]');
    const handle = target.closest('[data-canvas-link-handle]');
    if (handle && nodeEl && nodeEl.getAttribute('data-canvas-manual') === '1') {
      runtime.session = {
        type: 'link',
        pointerId: event.pointerId,
        root,
        fromId: nodeEl.getAttribute('data-canvas-node-id'),
      };
      event.preventDefault();
      try { root.setPointerCapture(event.pointerId); } catch (_) {}
      return;
    }
    const viewport = target.closest('.pfh-canvas-viewport');
    if (!viewport) return;
    if (nodeEl && nodeEl.getAttribute('data-canvas-draggable') === '1') {
      runtime.session = {
        type: 'drag',
        pointerId: event.pointerId,
        root,
        id: nodeEl.getAttribute('data-canvas-node-id'),
        nodeEl,
        manual: nodeEl.getAttribute('data-canvas-manual') === '1',
        startX: event.clientX,
        startY: event.clientY,
        origX: Number.parseFloat(nodeEl.style.left) || 0,
        origY: Number.parseFloat(nodeEl.style.top) || 0,
        x: Number.parseFloat(nodeEl.style.left) || 0,
        y: Number.parseFloat(nodeEl.style.top) || 0,
        moved: false,
      };
      nodeEl.classList.add('is-dragging');
      event.preventDefault();
      try { root.setPointerCapture(event.pointerId); } catch (_) {}
      return;
    }
    if (nodeEl) return;
    const vp = runtime.layout.viewport;
    runtime.session = {
      type: 'pan',
      pointerId: event.pointerId,
      root,
      viewport,
      startX: event.clientX,
      startY: event.clientY,
      origVx: Number(vp.x) || 0,
      origVy: Number(vp.y) || 0,
      moved: false,
    };
    viewport.classList.add('is-panning');
    try { root.setPointerCapture(event.pointerId); } catch (_) {}
  }

  function handleLedgerCanvasPointerMove(event) {
    const runtime = state.ledgerCanvas;
    const session = runtime && runtime.session;
    if (!session || event.pointerId !== session.pointerId) return;
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (session.type === 'drag') {
      if (!session.moved) {
        if (Math.abs(dx) + Math.abs(dy) <= 3) return;
        session.moved = true;
      }
      // Node left/top live in the pre-scale world space, so the screen-space
      // pointer delta must be divided by the viewport scale.
      const dragScale = ledgerCanvasClampScale(runtime.layout && runtime.layout.viewport ? runtime.layout.viewport.scale : 1);
      session.x = Math.max(0, session.origX + dx / dragScale);
      session.y = Math.max(0, session.origY + dy / dragScale);
      session.nodeEl.style.left = Math.round(session.x) + 'px';
      session.nodeEl.style.top = Math.round(session.y) + 'px';
      event.preventDefault();
      return;
    }
    if (session.type === 'pan') {
      if (!session.moved) {
        if (Math.abs(dx) + Math.abs(dy) <= 3) return;
        session.moved = true;
      }
      const layout = runtime.layout;
      layout.viewport.x = session.origVx + dx;
      layout.viewport.y = session.origVy + dy;
      applyLedgerCanvasViewportTransform(session.viewport, layout.viewport);
      event.preventDefault();
      return;
    }
    if (session.type === 'link') {
      const from = ledgerCanvasNodeAnchorById(session.root, session.fromId, 'bottom');
      const world = ledgerCanvasClientToWorld(session.root, event.clientX, event.clientY);
      const svg = session.root.querySelector('.pfh-canvas-edges');
      if (svg) {
        let path = svg.querySelector('.pfh-canvas-edge-preview');
        if (!path) {
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('class', 'pfh-canvas-edge-preview');
          svg.appendChild(path);
        }
        path.setAttribute('d', ledgerCanvasEdgePath(from.x, from.y, world.x, world.y));
      }
      event.preventDefault();
    }
  }

  function clearLedgerCanvasLinkPreview(root) {
    const path = root && root.querySelector('.pfh-canvas-edge-preview');
    if (path) path.remove();
  }

  function updateLedgerCanvasLinkModeHint(root) {
    const runtime = state.ledgerCanvas;
    const hint = root && root.querySelector('[data-canvas-link-hint]');
    if (hint) hint.hidden = !(runtime && runtime.linkMode);
    if (root) root.classList.toggle('is-link-mode', Boolean(runtime && runtime.linkMode));
  }

  function handleLedgerCanvasPointerEnd(event) {
    const runtime = state.ledgerCanvas;
    const session = runtime && runtime.session;
    if (!session) return;
    if (event && event.pointerId !== undefined && event.pointerId !== session.pointerId) return;
    runtime.session = null;
    const root = session.root;
    if (session.type === 'drag') {
      try { root.releasePointerCapture(session.pointerId); } catch (_) {}
      session.nodeEl.classList.remove('is-dragging');
      if (session.moved) {
        if (session.manual) {
          const manual = runtime.layout.manualNodes.find((node) => node.id === session.id);
          if (manual) {
            manual.x = Math.round(session.x);
            manual.y = Math.round(session.y);
          }
        } else {
          runtime.layout.positions[session.id] = { x: Math.round(session.x), y: Math.round(session.y) };
        }
        persistLedgerCanvasLayout(root);
      }
    } else if (session.type === 'pan') {
      try { root.releasePointerCapture(session.pointerId); } catch (_) {}
      if (session.viewport) session.viewport.classList.remove('is-panning');
      if (session.moved) scheduleLedgerCanvasLayoutSave();
    } else if (session.type === 'link') {
      try { root.releasePointerCapture(session.pointerId); } catch (_) {}
      clearLedgerCanvasLinkPreview(root);
      if (Number.isFinite(event && event.clientX)) {
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        const hitEl = hit && typeof hit.closest === 'function' ? hit.closest('[data-canvas-node-id]') : null;
        const hitId = hitEl ? hitEl.getAttribute('data-canvas-node-id') : '';
        if (hitId && hitId !== session.fromId) {
          toggleLedgerCanvasManualLink(root, session.fromId, hitId);
        } else if (!hitId) {
          runtime.linkMode = { fromId: session.fromId, at: Date.now() };
          updateLedgerCanvasLinkModeHint(root);
          showToast('未命中节点，已进入连线模式：点击目标节点完成连线，点空白处取消');
        }
      }
    }
    if (runtime.pendingRefresh) {
      runtime.pendingRefresh = false;
      refreshLedgerCanvasData(root);
    }
  }

  function handleLedgerCanvasWheel(event) {
    const viewport = event.currentTarget && event.currentTarget.querySelector('.pfh-canvas-viewport');
    if (!viewport) return;
    const runtime = state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    if (!runtime.layout) runtime.layout = loadLedgerCanvasLayout();
    event.preventDefault();
    const scale = ledgerCanvasClampScale(runtime.layout.viewport.scale);
    const nextScale = ledgerCanvasClampScale(scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12));
    if (nextScale === scale) return;
    const origin = ledgerCanvasViewportOrigin(event.currentTarget);
    const localX = event.clientX - origin.x;
    const localY = event.clientY - origin.y;
    const worldX = (localX - runtime.layout.viewport.x) / scale;
    const worldY = (localY - runtime.layout.viewport.y) / scale;
    runtime.layout.viewport.scale = nextScale;
    runtime.layout.viewport.x = localX - worldX * nextScale;
    runtime.layout.viewport.y = localY - worldY * nextScale;
    applyLedgerCanvasViewportTransform(viewport, runtime.layout.viewport);
    scheduleLedgerCanvasLayoutSave();
  }

  // ---- Manual node edits (inline input/textarea, saved on change + blur) ----

  function ledgerCanvasCommitManualEdit(el) {
    if (!el || typeof el.closest !== 'function') return;
    const root = el.closest('.pfh-canvas-root');
    if (!root || !root.isConnected) return;
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    const nodeEl = el.closest('[data-canvas-node-id]');
    if (!nodeEl) return;
    const manual = runtime.layout.manualNodes.find((node) => node.id === nodeEl.getAttribute('data-canvas-node-id'));
    if (!manual) return;
    if (el.hasAttribute('data-canvas-note-title')) manual.title = String(el.value || '').slice(0, 40);
    if (el.hasAttribute('data-canvas-note-text')) manual.note = String(el.value || '').slice(0, 240);
    persistLedgerCanvasLayout(root);
  }

  function handleLedgerCanvasFocusOut(event) {
    ledgerCanvasCommitManualEdit(event.target);
  }

  function handleLedgerCanvasChange(event) {
    ledgerCanvasCommitManualEdit(event.target);
  }

  // ---- Manual links + toolbar actions ----

  function toggleLedgerCanvasManualLink(root, fromId, toId) {
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    const manual = runtime.layout.manualNodes.find((node) => node.id === fromId);
    if (!manual || fromId === toId) return;
    manual.links = manual.links || [];
    if (manual.links.includes(toId)) {
      manual.links = manual.links.filter((link) => link !== toId);
      showToast('已取消连线');
    } else {
      if (manual.links.length >= LEDGER_CANVAS_MAX_MANUAL_LINKS) {
        showToast('单个节点连线已达上限 ' + LEDGER_CANVAS_MAX_MANUAL_LINKS + ' 条');
        return;
      }
      manual.links.push(toId);
      showToast('已连线');
    }
    persistLedgerCanvasLayout(root);
    refreshLedgerCanvasData(root);
  }

  function addLedgerCanvasManualNode(root) {
    const runtime = state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    if (!runtime.layout) runtime.layout = loadLedgerCanvasLayout();
    if (runtime.layout.manualNodes.length >= LEDGER_CANVAS_MAX_MANUAL_NODES) {
      showToast('手动节点已达上限 ' + LEDGER_CANVAS_MAX_MANUAL_NODES + ' 个');
      return;
    }
    const id = 'manual:' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const center = ledgerCanvasViewportCenterWorld(root);
    const offset = (runtime.layout.manualNodes.length % 12) * 24;
    runtime.layout.manualNodes.push({ id, kind: 'note', title: '', note: '', x: center.x + offset, y: center.y + offset, createdAtMs: Date.now(), links: [] });
    persistLedgerCanvasLayout(root);
    refreshLedgerCanvasData(root);
    const input = root.querySelector('[data-canvas-node-id="' + cssEscape(id) + '"] [data-canvas-note-title]');
    if (input) {
      input.focus();
      if (typeof input.select === 'function') input.select();
    }
  }

  function deleteLedgerCanvasNode(root, actionTarget) {
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    const nodeEl = actionTarget && typeof actionTarget.closest === 'function' ? actionTarget.closest('[data-canvas-node-id]') : null;
    if (!nodeEl) return;
    const id = nodeEl.getAttribute('data-canvas-node-id');
    const button = typeof actionTarget.closest === 'function' ? actionTarget.closest('button.pfh-canvas-node-delete') : null;
    if (!runtime.deleteArm || runtime.deleteArm.id !== id || Date.now() - runtime.deleteArm.at > LEDGER_CANVAS_DELETE_ARM_MS) {
      runtime.deleteArm = { id, at: Date.now() };
      if (button) {
        button.classList.add('is-armed');
        button.textContent = '确认';
        button.title = '再次点击删除';
      }
      window.setTimeout(() => {
        if (runtime.deleteArm && runtime.deleteArm.id === id && Date.now() - runtime.deleteArm.at >= LEDGER_CANVAS_DELETE_ARM_MS - 100) {
          runtime.deleteArm = null;
          if (button && button.isConnected) {
            button.classList.remove('is-armed');
            button.textContent = '✕';
            button.title = '删除节点';
          }
        }
      }, LEDGER_CANVAS_DELETE_ARM_MS + 100);
      return;
    }
    runtime.deleteArm = null;
    if (!runtime.layout.manualNodes.some((node) => node.id === id)) return;
    runtime.layout.manualNodes = runtime.layout.manualNodes.filter((node) => node.id !== id);
    runtime.layout.manualNodes.forEach((node) => {
      node.links = (node.links || []).filter((link) => link !== id);
    });
    persistLedgerCanvasLayout(root);
    refreshLedgerCanvasData(root);
    showToast('已删除手动节点');
  }

  function resetLedgerCanvasZoom(root) {
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    runtime.layout.viewport = { x: 0, y: 0, scale: 1 };
    applyLedgerCanvasViewportTransform(root.querySelector('.pfh-canvas-viewport'), runtime.layout.viewport);
    persistLedgerCanvasLayout(root);
  }

  function resetLedgerCanvasLayout(root) {
    const runtime = state.ledgerCanvas;
    if (!runtime || !runtime.layout) return;
    runtime.layout.positions = {};
    runtime.layout.viewport = { x: 0, y: 0, scale: 1 };
    applyLedgerCanvasViewportTransform(root.querySelector('.pfh-canvas-viewport'), runtime.layout.viewport);
    persistLedgerCanvasLayout(root);
    refreshLedgerCanvasData(root);
    showToast('画布布局已复位');
  }

  function handleLedgerCanvasPanelAction(action, actionTarget) {
    const root = actionTarget && typeof actionTarget.closest === 'function' ? actionTarget.closest('.pfh-canvas-root') : null;
    if (!root || !root.isConnected) return;
    const runtime = state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    if (!runtime.layout) runtime.layout = loadLedgerCanvasLayout();
    if (action === 'canvas-add-node') {
      addLedgerCanvasManualNode(root);
      return;
    }
    if (action === 'canvas-delete-node') {
      deleteLedgerCanvasNode(root, actionTarget);
      return;
    }
    if (action === 'canvas-refresh') {
      if (runtime.session) {
        runtime.pendingRefresh = true;
      } else {
        runtime.pendingRefresh = false;
        refreshLedgerCanvasData(root);
      }
      return;
    }
    if (action === 'canvas-reset-zoom') {
      resetLedgerCanvasZoom(root);
      return;
    }
    if (action === 'canvas-reset-layout') {
      resetLedgerCanvasLayout(root);
    }
  }

  // ---- Setup: bind once per canvas root; listeners die with the root ----

  function setupLedgerCanvas(root) {
    if (!root || !root.isConnected) return;
    ensureLedgerCanvasStyles();
    const runtime = state.ledgerCanvas = state.ledgerCanvas || ledgerCanvasRuntimeState();
    // A session from a previous root never survives a content swap.
    runtime.session = null;
    runtime.pendingRefresh = false;
    runtime.deleteArm = null;
    runtime.linkMode = null;
    if (!runtime.layout) runtime.layout = loadLedgerCanvasLayout();
    if (root.getAttribute('data-canvas-setup') === '1') return;
    root.setAttribute('data-canvas-setup', '1');
    const viewport = root.querySelector('.pfh-canvas-viewport');
    if (!viewport) return;
    applyLedgerCanvasViewportTransform(viewport, runtime.layout.viewport);
    placeUnplacedLedgerCanvasManualNodes(root);
    root.addEventListener('pointerdown', handleLedgerCanvasPointerDown);
    root.addEventListener('pointermove', handleLedgerCanvasPointerMove);
    root.addEventListener('pointerup', handleLedgerCanvasPointerEnd);
    root.addEventListener('pointercancel', handleLedgerCanvasPointerEnd);
    root.addEventListener('lostpointercapture', handleLedgerCanvasPointerEnd);
    root.addEventListener('wheel', handleLedgerCanvasWheel, { passive: false });
    root.addEventListener('focusout', handleLedgerCanvasFocusOut);
    root.addEventListener('change', handleLedgerCanvasChange);
  }
