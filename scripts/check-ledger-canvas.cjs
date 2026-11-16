// Ledger canvas checks: drives the pure model, the layout persistence
// fallbacks/caps, the read-only data intake and the session-deferred refresh
// semantics of src/core-ledger-canvas.module.js inside a node:vm sandbox.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../src/core-ledger-canvas.module.js'), 'utf8').replace(/\r\n/g, '\n');

// Values created inside the vm sandbox carry another realm's prototypes, so
// deepStrictEqual needs them cloned into this realm before comparing.
const clone = (value) => JSON.parse(JSON.stringify(value));

const gmStore = new Map();
let lastReadKey = '';
let lastWrittenKey = '';
const context = {
  state: {},
  GM_getValue: (key, fallback) => { lastReadKey = key; return gmStore.has(key) ? gmStore.get(key) : fallback; },
  GM_setValue: (key, value) => { lastWrittenKey = key; gmStore.set(key, value); },
};
vm.createContext(context);
vm.runInContext(source, context);

// ---- buildLedgerCanvasModel: lanes, task ids, stages, edges, overrides ----
const buildModel = context.buildLedgerCanvasModel;
assert.equal(typeof buildModel, 'function', 'buildLedgerCanvasModel must be exported by the module source');

const records = [
  { date: '2026-11-17', sku: 'A1', brand: '厂牌', name: '产品一', designType: '纸盒', artPriority: 'P0紧急', createdAtMs: 5 },
  { date: '2026-11-17', sku: 'A2', imageGeneratedAt: '2026-11-17 10:00', imageGeneratedAtMs: 1763344800000, createdAtMs: 6 },
  { date: '2026-11-17', sku: 'A3', finalizedAt: '2026-11-17 11:00', finalizedAtMs: 1763348400000, createdAtMs: 7 },
  { date: '2026-11-17', sku: 'A4', status: '作废', createdAtMs: 8, updatedAtMs: 1763352000000 },
  { date: '2026-11-17', sku: 'A5', finalizedAt: '2026-11-17 09:00', finalizedAtMs: 1763341200000, createdAtMs: 9 },
  { date: '2026-11-17', sku: '', createdAtMs: 10 },
];
const model = buildModel(records, null);

assert.deepEqual(clone(model.lanes.map((lane) => lane.id)), ['lane-pending', 'lane-generated', 'lane-finalized'], 'lane chain order is fixed');
assert.deepEqual(clone(model.lanes.map((lane) => lane.count)), [1, 1, 3], 'lane counts cover every record stage');
assert.deepEqual(clone(model.edges.slice(0, 2)), [
  { from: 'lane-pending', to: 'lane-generated' },
  { from: 'lane-generated', to: 'lane-finalized' },
], 'lane chain edges come first');

const byId = new Map(model.nodes.map((node) => [node.id, node]));
assert.equal(model.nodes.length, 5, 'one task node per non-empty sku record');
const a1 = byId.get('task:2026-11-17::A1');
assert.ok(a1, 'task node id matches the date::sku composite key');
assert.equal(a1.stage, 'pending', 'un-generated record lands in the pending lane');
assert.equal(a1.x, 40, 'pending auto x uses the first lane');
assert.equal(a1.y, 96, 'first pending task starts at the task top');
assert.deepEqual(clone(a1.badges), ['纸盒', 'P0紧急'], 'design type and priority become badges');
assert.equal(a1.title, '厂牌 产品一', 'task title joins brand and name');
assert.equal(a1.sub, 'A1', 'task sub is the raw sku');

assert.equal(byId.get('task:2026-11-17::A2').stage, 'generated');
assert.equal(byId.get('task:2026-11-17::A2').x, 360, 'generated auto x uses the second lane');
assert.equal(byId.get('task:2026-11-17::A3').stage, 'finalized');
assert.equal(byId.get('task:2026-11-17::A3').x, 680, 'finalized auto x uses the third lane');
assert.equal(byId.get('task:2026-11-17::A4').stage, 'finalized', 'voided records count as finalized');
assert.ok(byId.get('task:2026-11-17::A3').y < byId.get('task:2026-11-17::A4').y, 'finalized column sorts by finalized time ascending');
assert.ok(byId.get('task:2026-11-17::A5').y < byId.get('task:2026-11-17::A3').y, '09:00 finalized sorts before 11:00');

assert.ok(model.edges.some((edge) => edge.from === 'task:2026-11-17::A1' && edge.to === 'lane-generated'), 'pending task flows into the generated lane head');
assert.ok(model.edges.some((edge) => edge.from === 'task:2026-11-17::A2' && edge.to === 'lane-finalized'), 'generated task flows into the finalized lane head');
assert.ok(model.edges.some((edge) => edge.from === 'lane-finalized' && edge.to === 'task:2026-11-17::A3'), 'finalized lane head flows into finalized tasks');
assert.ok(model.edges.every((edge) => !edge.dashed || String(edge.from).startsWith('manual:')), 'only manual links render dashed');

// Position override + manual nodes + dangling link skip.
const layoutWithManual = {
  positions: { 'task:2026-11-17::A1': { x: 500, y: 400 } },
  manualNodes: [
    { id: 'manual:1', kind: 'note', title: '备注', note: '内容', x: 10, y: 20, links: ['task:2026-11-17::A1', 'manual:ghost'] },
    { id: 'manual:2', kind: 'step', title: '里程碑' },
  ],
};
const model2 = buildModel(records, layoutWithManual);
const a1b = model2.nodes.find((node) => node.id === 'task:2026-11-17::A1');
assert.equal(a1b.x, 500, 'saved positions override the auto layout');
assert.equal(a1b.y, 400, 'saved positions override the auto layout y');
const manual1 = model2.nodes.find((node) => node.id === 'manual:1');
assert.equal(manual1.kind, 'note', 'manual note node kind is kept');
assert.ok(model2.edges.some((edge) => edge.from === 'manual:1' && edge.to === 'task:2026-11-17::A1' && edge.dashed), 'manual link becomes a dashed edge');
assert.ok(!model2.edges.some((edge) => edge.to === 'manual:ghost'), 'dangling manual link is skipped');
const manual2 = model2.nodes.find((node) => node.id === 'manual:2');
assert.equal(manual2.kind, 'step', 'manual step node kind is kept');
assert.equal(manual2.x, 240, 'unplaced manual node gets the staggered fallback');
assert.equal(manual2.y, 240, 'unplaced manual node gets the staggered fallback');

// Truncation cap.
const many = Array.from({ length: 220 }, (_, index) => ({ date: '2026-11-17', sku: 'B' + index }));
const model3 = buildModel(many, null);
assert.equal(model3.nodes.length, 200, 'task nodes are capped at 200');
assert.equal(model3.truncatedCount, 20, 'overflow is reported as truncatedCount');
assert.equal(model3.lanes[0].count, 220, 'lane count stays truthful beyond the cap');

// ---- loadLedgerCanvasLayout: bad data fallback and caps ----
// const declarations stay in the vm's lexical scope, so the key constants are
// verified through the keys the storage stubs actually observe.
assert.equal(lastReadKey, '', 'no storage read happened while loading the module');
gmStore.set('plm-floating-helper:ledger-canvas-layout:v1', 'not-an-object');
const fallback = context.loadLedgerCanvasLayout();
assert.equal(lastReadKey, 'plm-floating-helper:ledger-canvas-layout:v1', 'layout key matches the documented namespace');
assert.deepEqual(clone(fallback), { version: 1, updatedAtMs: 0, viewport: { x: 0, y: 0, scale: 1 }, positions: {}, manualNodes: [] }, 'garbage storage falls back to defaults');
assert.ok(source.includes("const LEDGER_CANVAS_STYLE_ID = 'plm-floating-helper-ledger-canvas-style'"), 'style id stays inside the helper namespace');

const bloated = {
  viewport: { scale: 9, x: 3, y: -4 },
  positions: Object.fromEntries(Array.from({ length: 505 }, (_, index) => ['p' + index, { x: index, y: index }])),
  manualNodes: Array.from({ length: 150 }, (_, index) => ({ id: 'm' + index })),
  customField: 'kept',
};
gmStore.set('plm-floating-helper:ledger-canvas-layout:v1', bloated);
const capped = context.loadLedgerCanvasLayout();
assert.equal(capped.viewport.scale, 2, 'scale is clamped to 2');
assert.equal(capped.viewport.x, 3, 'viewport x is kept');
assert.equal(capped.viewport.y, -4, 'viewport y is kept');
assert.equal(Object.keys(capped.positions).length, 500, 'positions are capped at 500');
assert.equal(capped.manualNodes.length, 100, 'manual nodes are capped at 100');
assert.equal(capped.customField, 'kept', 'unknown fields pass through');
const manualNode = capped.manualNodes[0];
assert.equal(manualNode.title, '', 'manual titles normalize to an empty string');
assert.deepEqual(clone(manualNode.links), [], 'manual links normalize to an array');

// ---- saveLedgerCanvasLayout: prune stale positions and persist ----
const saved = context.saveLedgerCanvasLayout({
  positions: { keep: { x: 1, y: 2 }, stale: { x: 3, y: 4 } },
  manualNodes: [{ id: 'm1', x: 'nope' }],
  viewport: { scale: 0.1 },
}, ['keep']);
assert.deepEqual(Object.keys(saved.positions), ['keep'], 'stale positions are pruned against the current node set');
assert.equal(saved.viewport.scale, 0.4, 'save clamps the scale');
assert.equal(saved.manualNodes[0].x, null, 'non-numeric manual positions normalize to null');
assert.ok(saved.updatedAtMs > 0, 'save stamps the update time');
assert.equal(lastWrittenKey, 'plm-floating-helper:ledger-canvas-layout:v1', 'save writes the same layout key');
assert.equal(gmStore.get('plm-floating-helper:ledger-canvas-layout:v1').version, 1, 'save writes version 1');

// ---- refreshLedgerCanvasData: session defers the rebuild ----
context.state.ledgerCanvas = { session: { type: 'drag' }, pendingRefresh: false };
const liveRoot = {
  isConnected: true,
  querySelector: () => { throw new Error('rebuild attempted while a pointer session is active'); },
};
assert.equal(context.refreshLedgerCanvasData(liveRoot), true, 'session defers the refresh and reports success');
assert.equal(context.state.ledgerCanvas.pendingRefresh, true, 'deferred refresh is flagged for the pointerup handler');
assert.equal(context.refreshLedgerCanvasData({ isConnected: false }), false, 'detached roots are ignored');
context.state.ledgerCanvas = { session: null, pendingRefresh: false };
assert.equal(context.refreshLedgerCanvasData({ isConnected: true, querySelector: () => null }), false, 'missing canvas layers are ignored safely');

// ---- collectLedgerCanvasRecords: today filter + dedupe over both lists ----
context.getTodayKey = () => '2026-11-17';
context.getCurrentLedgerMonth = () => '2026-11';
context.normalizeLedgerDate = (value) => {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return match ? [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-') : '';
};
context.getLedgerRecordsForMonth = (view) => (view === 'finalized'
  ? [
      { date: '2026-11-17', sku: 'A1', finalizedAt: '2026-11-17 09:00', finalizedDate: '2026-11-17' },
      { date: '2026-11-17', sku: 'A3', finalizedAt: '2026-11-17 10:00', finalizedDate: '2026-11-17' },
    ]
  : [
      { date: '2026-11-17', sku: 'A1' },
      { date: '2026-11-16', sku: 'A2' },
    ]);
context.getLedgerDesignDate = (record) => record.date;
context.getLedgerFinalizedDate = (record) => record.finalizedDate || record.date;
const combined = context.collectLedgerCanvasRecords();
assert.deepEqual(clone(combined.map((record) => record.sku)), ['A1', 'A3'], 'today records from both lists merge with dedupe');

// ---- persistLedgerCanvasLayout: prune only against a live root ----
context.state.ledgerCanvas = { session: null, pendingRefresh: false, layout: {
  positions: { keep: { x: 1, y: 1 }, drop: { x: 2, y: 2 } },
  manualNodes: [],
} };
context.persistLedgerCanvasLayout(null);
let stored = gmStore.get('plm-floating-helper:ledger-canvas-layout:v1');
assert.deepEqual(Object.keys(stored.positions).sort(), ['drop', 'keep'], 'a save without a live root never prunes positions');

const pruneRoot = {
  isConnected: true,
  querySelectorAll: (selector) => (selector === '[data-canvas-draggable]'
    ? ['task:2026-11-17::A1'].map((id) => ({ getAttribute: (name) => (name === 'data-canvas-manual' ? '0' : id) }))
    : []),
};
context.state.ledgerCanvas.layout.positions = { 'task:2026-11-17::A1': { x: 5, y: 6 }, drop: { x: 2, y: 2 } };
context.persistLedgerCanvasLayout(pruneRoot);
stored = gmStore.get('plm-floating-helper:ledger-canvas-layout:v1');
assert.deepEqual(Object.keys(stored.positions), ['task:2026-11-17::A1'], 'a live-root save prunes positions to the current task nodes');

// ---- placeUnplacedLedgerCanvasManualNodes: viewport-center stagger ----
context.state.ledgerCanvas = { session: null, pendingRefresh: false, layout: {
  viewport: { x: 0, y: 0, scale: 1 },
  positions: {},
  manualNodes: [
    { id: 'manual:a', x: null, y: null },
    { id: 'manual:b', x: null, y: null },
    { id: 'manual:c', x: 30, y: 40 },
  ],
} };
const placedRoot = {
  isConnected: true,
  querySelector: (selector) => (selector === '.pfh-canvas-viewport' ? { offsetWidth: 800, offsetHeight: 500 } : null),
  querySelectorAll: () => [],
};
context.placeUnplacedLedgerCanvasManualNodes(placedRoot);
const manualLayout = context.state.ledgerCanvas.layout.manualNodes;
assert.equal(manualLayout[0].x, 292, 'unplaced manual node lands at the viewport center');
assert.equal(manualLayout[0].y, 190, 'unplaced manual node lands at the viewport center');
assert.equal(manualLayout[1].x, 316, 'unplaced manual nodes stagger by 24px');
assert.equal(manualLayout[1].y, 214, 'unplaced manual nodes stagger by 24px');
assert.equal(manualLayout[2].x, 30, 'already placed manual nodes keep their position');
stored = gmStore.get('plm-floating-helper:ledger-canvas-layout:v1');
assert.equal(stored.manualNodes[0].x, 292, 'placement persists to the layout key');

console.log('Ledger canvas model, layout persistence, data intake, and session-deferred refresh passed');
