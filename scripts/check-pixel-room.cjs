const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const start = source.indexOf('  function normalizePixelRoomTime(');
const end = source.indexOf('  function homeClockText(', start);
const context = { Intl, state: { settings: {} } };
vm.createContext(context);
const globals = ['pixelRoomOvertime', 'pixelRoomDay', 'pixelRoomAnimationFrame', 'pixelRoomVisibilityBound', 'pixelRoomWeather', 'pixelRoomWeatherLoaded', 'pixelRoomWeatherPromise', 'pixelRoomWeatherNextAttempt', 'pixelRoomRestUntil', 'pixelRoomCatCommand', 'pixelRoomLastCat', 'pixelRoomPicture', 'pixelRoomPictureLoaded'].map((name) => {
  const declaration = source.match(new RegExp('  let ' + name + ' = [^;]+;'));
  assert.ok(declaration && declaration.index < source.indexOf('  renderShell(L.noDrawer);'), name + ' must initialize before startup rendering');
  return declaration[0];
}).join('\n');
vm.runInContext(globals + source.slice(start, end), context);
const moment = (time, overtime = false, endTime = '18:00') => context.pixelRoomMoment(new Date('2026-10-06T' + time + ':00+08:00'), endTime, overtime);
assert.equal(moment('16:59').phase, 'day');
assert.equal(moment('17:00').phase, 'sunset');
assert.equal(moment('17:45').phase, 'packing');
assert.equal(moment('18:00').phase, 'closed');
assert.equal(moment('23:59').phase, 'closed');
assert.equal(moment('18:01', true).phase, 'night');
assert.equal(moment('18:01', false, '19:00').phase, 'sunset');
assert.equal(moment('17:30').remaining, 30);
assert.equal(moment('17:30').title, '距下班还有 30 分钟');
assert.equal(moment('09:00').day, '20261006');
assert.equal(context.normalizePixelRoomTime('25:00'), '18:00');
assert.equal(context.normalizePixelRoomTime('09:30'), '09:30');
assert.match(context.pixelRoomSettingsHtml(), /type="checkbox" class="pfh-pixel-room-enabled">/);
context.state.settings.pixelRoomEnabled = true;
assert.match(context.pixelRoomSettingsHtml(), /pfh-pixel-room-enabled" checked/);
assert.match(source, /pixelRoomEnabled: false, pixelRoomEndTime: '18:00'/);
assert.match(source, /state.settings.pixelRoomEnabled === true \? pixelRoomCardHtml\(\) : homeTrendCardHtml/);
assert.match(source, /pixelRoomDay !== moment.day.*pixelRoomOvertime = false/);
assert.equal(context.pixelRoomActivity(0, false).action, 'typing');
assert.equal(context.pixelRoomActivity(24, false).action, 'drinking');
assert.equal(context.pixelRoomActivity(32, false).action, 'stretching');
assert.equal(context.pixelRoomActivity(38, false).action, 'waving');
assert.equal(context.pixelRoomActivity(44, false).action, 'watching-cat');
assert.equal(context.pixelRoomActivity(50, false).action, 'standing');
assert.equal(context.pixelRoomActivity(80, false).action, 'typing');
assert.equal(context.pixelRoomActivity(24, true).action, 'packing');
assert.match(context.pixelRoomCardHtml(), /窗边日常/);
assert.match(context.pixelRoomSettingsHtml(), /窗边日常/);
const homeDefinitions = source.slice(source.indexOf('const HOME_FEATURE_DEFINITIONS'), source.indexOf('const HOME_FEATURE_DEFINITIONS') + 3000);
assert.ok(homeDefinitions.includes('magicUpload'));
assert.ok(!homeDefinitions.includes("badge: 'BETA'"));
for (const [tick, action] of [[0, 'walking'], [16, 'grooming'], [28, 'sleeping'], [44, 'stretching'], [52, 'walking'], [68, 'sitting']]) assert.equal(context.pixelRoomCatActivity(tick, false).action, action);
assert.equal(context.pixelRoomCatActivity(0, true).action, 'sleeping');
assert.ok(context.pixelRoomCatActivity(10, false).x > context.pixelRoomCatActivity(0, false).x);
const at = (time) => new Date('2026-10-06T' + time + ':00+08:00');
const sample = {
  current: { time: at('10:00').getTime() / 1000, temperature_2m: 27, weather_code: 3, cloud_cover: 97, wind_speed_10m: 10 },
  daily: { sunrise: [at('06:00').getTime() / 1000], sunset: [at('18:00').getTime() / 1000] },
};
const weather = context.parsePixelRoomWeather(sample, at('10:00').getTime());
assert.equal(context.pixelRoomWeatherKind(95).kind, 'storm');
assert.equal(context.pixelRoomWeatherKind(63).kind, 'rain');
assert.equal(context.pixelRoomWeatherKind(45).kind, 'fog');
assert.equal(context.pixelRoomWeatherKind(73).kind, 'snow');
assert.throws(() => context.parsePixelRoomWeather({}, Date.now()));
assert.throws(() => context.parsePixelRoomWeather({ ...sample, daily: { sunrise: [2], sunset: [1] } }, Date.now()));
const morning = context.pixelRoomOutdoor(at('08:00'), weather);
const noon = context.pixelRoomOutdoor(at('12:00'), weather);
const afternoon = context.pixelRoomOutdoor(at('16:00'), weather);
assert.ok(morning.sunX < noon.sunX && noon.sunX < afternoon.sunX);
assert.ok(noon.sunY < morning.sunY && noon.sunY < afternoon.sunY);
assert.equal(context.pixelRoomOutdoor(at('18:00'), weather).night, true);
assert.equal(context.pixelRoomOutdoor(at('05:00'), weather).night, true);
assert.equal(context.pixelRoomOutdoor(at('10:00'), weather).kind, 'overcast');
assert.match(context.pixelRoomOutdoor(at('12:00'), weather).label, /缓存/);
assert.match(context.pixelRoomOutdoor(new Date('2026-10-08T12:00:00+08:00'), weather).label, /天气未连接/);
assert.match(context.pixelRoomOutdoor(at('12:00'), null).label, /昼夜示意/);
assert.match(source, /@connect\s+api.open-meteo.com/);

// Exercise real raster drawing without opening a browser or touching user settings.
const { createCanvas } = require('/Users/violet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const phases = ['day', 'sunset', 'packing', 'closed', 'night'];
const images = [];
for (const phase of phases) {
  const canvas = createCanvas(480, 168);
  context.drawPixelRoom(canvas.getContext('2d'), { phase, warmth: phase === 'day' ? 0 : 0.75 }, 120);
  images.push(canvas);
}
assert.notDeepEqual(images[0].toBuffer('image/png'), images[4].toBuffer('image/png'));
assert.notDeepEqual(images[2].toBuffer('image/png'), images[3].toBuffer('image/png'));
const actorFrame = (tick) => {
  const canvas = createCanvas(480, 168);
  const ctx = canvas.getContext('2d');
  context.drawPixelRoom(ctx, { phase: 'day', warmth: 0 }, tick);
  return Buffer.from(ctx.getImageData(253, 75, 65, 72).data);
};
assert.notDeepEqual(actorFrame(0), actorFrame(0.25), 'typing must move within the first second');
assert.notDeepEqual(actorFrame(0), actorFrame(24), 'drinking must change the character');
assert.notDeepEqual(actorFrame(24), actorFrame(32), 'stretching must change the character');
const catFrame = (tick) => {
  const canvas = createCanvas(180, 168);
  context.drawPixelRoomCat(canvas.getContext('2d'), tick, false);
  return canvas.toBuffer('image/png');
};
assert.notDeepEqual(catFrame(0), catFrame(0.25), 'cat legs and tail must animate');
assert.notDeepEqual(catFrame(16), catFrame(28), 'grooming and sleeping must differ');

// Drive the actual animation scheduler with a visible canvas and reduced-motion OS.
// No browser, live PLM session or saved user preferences are used.
const requests = new Map();
let nextId = 0;
let visible = true;
let timestamp = 0;
let visibilityListener;
const canvas = createCanvas(480, 168);
canvas.isConnected = true;
canvas.closest = () => ({ getAttribute: () => visible ? 'false' : 'true' });
canvas.parentElement = { querySelector: () => ({ textContent: '', setAttribute() {} }) };
canvas.setAttribute = () => {};
const roomListeners = {};
canvas.addEventListener = (name, listener) => { roomListeners[name] = listener; };
canvas.getBoundingClientRect = () => ({ left: 20, top: 40, width: 960, height: 336 });
context.homeClockOffsetMs = 0;
vm.runInContext('pixelRoomWeatherLoaded = true; pixelRoomWeatherNextAttempt = Infinity;', context);
context.state.expanded = true;
context.state.settings.pixelRoomAnimation = true;
context.document = {
  hidden: false,
  querySelector: () => canvas,
  addEventListener: (type, listener) => { assert.equal(type, 'visibilitychange'); visibilityListener = listener; },
};
context.window = {
  performance: { now: () => timestamp },
  matchMedia: () => ({ matches: true }),
  requestAnimationFrame: (callback) => { requests.set(++nextId, callback); return nextId; },
  cancelAnimationFrame: (id) => requests.delete(id),
};
const advance = (value) => {
  timestamp = value;
  const callbacks = Array.from(requests.values());
  requests.clear();
  callbacks.forEach((callback) => callback(value));
};
context.setupPixelRoomAnimation();
assert.equal(requests.size, 1);
advance(0);
const firstFrame = canvas.toBuffer('image/png');
advance(300);
assert.notDeepEqual(firstFrame, canvas.toBuffer('image/png'), 'explicit theater animation must run even when OS reduced-motion is on');
context.setupPixelRoomAnimation();
assert.equal(requests.size, 1, 'repeated setup must not duplicate animation loops');
context.document.hidden = true;
visibilityListener();
assert.equal(requests.size, 0, 'background pages must stop');
context.document.hidden = false;
visibilityListener();
assert.equal(requests.size, 1, 'foreground pages must resume');
visible = false;
advance(600);
assert.equal(requests.size, 0, 'hidden carousel slides must stop');
visible = true;
context.state.settings.pixelRoomAnimation = false;
context.setupPixelRoomAnimation();
assert.equal(requests.size, 0, 'animation switch must support static mode');
context.updatePixelRoom(0);
const staticFrame = canvas.toBuffer('image/png');
context.updatePixelRoom(10);
assert.deepEqual(staticFrame, canvas.toBuffer('image/png'));
context.state.settings.pixelRoomAnimation = true;
context.setupPixelRoomAnimation();
canvas.isConnected = false;
advance(900);
assert.equal(requests.size, 0, 'removed canvases must stop');
assert.match(source, /function renderShell\(statusText\) \{\s+stopPixelRoomAnimation\(\)/);
// New room behavior uses the same Shanghai clock, including exact lunch boundaries.
for (const [time, lunch] of [['11:59', false], ['12:00', true], ['13:29', true], ['13:30', false]]) assert.equal(context.pixelRoomRest(moment(time), 0).lunch, lunch, time);
vm.runInContext('pixelRoomRestUntil = 1800000;', context);
assert.equal(context.pixelRoomRest(moment('10:00'), 1799999).manual, true);
assert.equal(context.pixelRoomRest(moment('10:00'), 1800000).manual, false);
vm.runInContext('pixelRoomRestUntil = 0; pixelRoomCatCommand = null;', context);
const scene = (kind = 'clear', rest = {}) => ({ phase: 'day', remaining: 30, outdoor: { kind, night: false, wind: 25, warmth: .2 }, rest });
assert.equal(context.resolvePixelRoomCat(10, scene('rain')).box, true);
assert.equal(context.resolvePixelRoomCat(10, scene('clear')).y, 101, 'sunny windowsill');
assert.equal(context.resolvePixelRoomCat(160, scene('overcast')).blocking, true);
assert.equal(context.resolvePixelRoomCat(10, scene('rain', { lunch: true })).x, 278, 'chair wins over weather during lunch');
context.saveSettings = () => {};
vm.runInContext('pixelRoomLastCat = { x: 75, y: 143, flip: false, night: true };', context);
context.interactPixelRoom('lamp', 0, 100);
assert.equal(context.state.settings.pixelRoomLamp, false, 'click turns automatic night lamp off');
context.interactPixelRoom('lamp', 0, 100);
assert.equal(context.state.settings.pixelRoomLamp, true);
context.interactPixelRoom('cup', 0, 100);
assert.equal(context.state.settings.pixelRoomCup, 1);
context.interactPixelRoom('curtain', 0, 100);
assert.equal(context.state.settings.pixelRoomCurtains, true);
assert.equal(context.pixelRoomHit(150, 50, null, false), 'curtain', 'closed curtains can be opened at center');
context.interactPixelRoom('cat', 75, 100);
assert.equal(context.resolvePixelRoomCat(100.1, scene('rain')).flip, true, 'clicked cat turns toward you, overriding rain');
context.interactPixelRoom('floor', 300, 100);
const walkStart = context.resolvePixelRoomCat(100, scene('rain'));
const walkMiddle = context.resolvePixelRoomCat(101, scene('rain'));
const walkEnd = context.resolvePixelRoomCat(104, scene('rain'));
assert.equal(walkStart.x, 75);
assert.ok(walkMiddle.x > walkStart.x && walkMiddle.x < walkEnd.x);
assert.equal(walkEnd.x, 285);
assert.equal(walkEnd.y, 143);
context.interactPixelRoom('desk', 250, 100);
assert.ok(context.resolvePixelRoomCat(100.45, scene()).y < 123, 'cat follows an upward jump arc');
assert.equal(context.resolvePixelRoomCat(101, scene()).y, 103, 'cat lands on desk');
context.state.settings.pixelRoomAnimation = false;
assert.equal(context.resolvePixelRoomCat(100, scene()).y, 103, 'manual interactions still work with animation disabled');
context.state.settings.pixelRoomAnimation = true;
assert.equal(context.pixelRoomHit(320, 95, null, false), 'lamp');
assert.equal(context.pixelRoomHit(245, 118, null, false), 'cup');
assert.equal(context.pixelRoomHit(426, 30, null, false), 'picture');
assert.equal(context.pixelRoomHit(250, 120, null, true), 'desk');
assert.equal(context.pixelRoomHit(250, 40, null, true), '');
assert.equal(context.pixelRoomHit(250, 150, null, false), 'floor');
assert.equal(context.pixelRoomHit(78, 148, { x: 75, y: 143 }, false), 'cat');
assert.match(source, /if \(event.target.closest\('\.pfh-pixel-room-canvas'\)\) \{ pauseUntil = Date.now\(\) \+ 60000; return; \}/, 'carousel must not capture room clicks');
assert.equal(Object.keys(roomListeners).length, 2, 'listeners only bind once');
vm.runInContext('pixelRoomCatCommand = null; pixelRoomLastCat = { x: 75, y: 143, flip: false };', context);
timestamp = 100000;
roomListeners.click({ clientX: 20 + 300 * 2, clientY: 40 + 150 * 2, detail: 1, preventDefault() {}, stopPropagation() {} });
assert.equal(vm.runInContext('pixelRoomCatCommand.x', context), 285, 'hit testing respects CSS-scaled canvas');
vm.runInContext('pixelRoomCatCommand = null;', context);
context.state.settings.pixelRoomCurtains = false;
const render = (moment, tick = 80) => { const canvas = createCanvas(480, 168); context.drawPixelRoom(canvas.getContext('2d'), moment, tick); return canvas; };
const daylight = render(scene());
context.state.settings.pixelRoomCurtains = true;
assert.notDeepEqual(render(scene()).toBuffer('image/png'), daylight.toBuffer('image/png'));
context.state.settings.pixelRoomCurtains = false;
const extras = [render(scene('rain')), render(scene('clear'), 10), render(scene('overcast'), 160), render({ ...scene(), minutes: 720, rest: { lunch: true } }), render({ ...scene(), rest: { manual: true } })];
context.state.settings.pixelRoomLamp = false;
assert.notDeepEqual(render(scene()).toBuffer('image/png'), daylight.toBuffer('image/png'), 'lamp toggles must redraw');
context.state.settings.pixelRoomLamp = true;
context.state.settings.pixelRoomCup = 2;
assert.notDeepEqual(render(scene()).toBuffer('image/png'), daylight.toBuffer('image/png'), 'cup style changes must redraw');
context.state.settings.pixelRoomCup = 1;
if (process.argv.includes('--preview')) {
  const sheet = createCanvas(960, (images.length + extras.length) * 336);
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  [...images, ...extras].forEach((canvas, i) => ctx.drawImage(canvas, 0, i * 336, 960, 336));
  fs.mkdirSync(path.join(__dirname, '../tmp'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../tmp/pixel-room-scenes.png'), sheet.toBuffer('image/png'));
}
async function checkWeatherRequests() {
  canvas.isConnected = true;
  let calls = 0;
  let request;
  let saved;
  context.GM_xmlhttpRequest = (options) => { calls++; request = options; };
  context.GM_setValue = (key, value) => { saved = value; assert.equal(key, 'pfh-pixel-room-weather-longhu-v1'); };
  vm.runInContext('pixelRoomWeather = null; pixelRoomWeatherNextAttempt = 0;', context);
  context.refreshPixelRoomWeather();
  context.refreshPixelRoomWeather();
  assert.equal(calls, 1, 'weather fetches must coalesce');
  assert.match(request.url, /latitude=23\.3740&longitude=116\.7320/);
  assert.match(request.url, /timeformat=unixtime/);
  request.onload({ status: 200, responseText: JSON.stringify(sample) });
  await vm.runInContext('pixelRoomWeatherPromise', context);
  assert.equal(saved.code, 3);
  context.refreshPixelRoomWeather();
  assert.equal(calls, 1, 'fresh cached weather must avoid another request');
  vm.runInContext('pixelRoomWeather.fetchedAt -= 3600000; pixelRoomWeatherNextAttempt = 0;', context);
  context.refreshPixelRoomWeather();
  assert.equal(calls, 2);
  request.onerror();
  await vm.runInContext('pixelRoomWeatherPromise', context);
  assert.equal(vm.runInContext('pixelRoomWeather.code', context), 3, 'network failures must preserve cache');
  context.refreshPixelRoomWeather();
  assert.equal(calls, 2, 'network failures must back off');
  console.log('Pixel room interactions, scaled hit testing, lunch boundaries, manual rest, cat behavior, animation, weather and cache passed');
}
async function checkRoomPictures() {
  const originalDocument = context.document;
  const originalUpdate = context.updatePixelRoom;
  let updates = 0, input, drawArgs, saved, revoked;
  const notices = [];
  context.updatePixelRoom = () => updates++;
  context.showToast = (text) => notices.push(text);
  context.Image = class { constructor() { this.naturalWidth = 640; this.naturalHeight = 400; } set src(value) { this.value = value; this.onload(); } };
  context.URL = { createObjectURL: () => 'blob:room-test', revokeObjectURL: (url) => revoked = url };
  context.GM_setValue = (key, value) => saved = { key, value };
  context.document = { createElement: (name) => {
    if (name === 'input') return input = { files: [{ type: 'image/png', size: 1024 }], click() {} };
    return { getContext: () => ({ drawImage: (...args) => drawArgs = args }), toDataURL: () => 'data:image/jpeg;base64,LOCALTEST' };
  } };
  context.loadPixelRoomPicture('data:image/svg+xml;base64,REJECT');
  assert.equal(vm.runInContext('pixelRoomPicture', context), null);
  context.loadPixelRoomPicture('data:image/png;base64,' + 'x'.repeat(100000));
  assert.equal(vm.runInContext('pixelRoomPicture', context), null);
  context.choosePixelRoomPicture();
  assert.equal(input.accept, 'image/png,image/jpeg,image/webp');
  await input.onchange();
  assert.equal(saved.key, 'pfh-pixel-room-picture-v1');
  assert.match(saved.value, /^data:image\/jpeg;base64,/);
  assert.equal(revoked, 'blob:room-test');
  assert.deepEqual(drawArgs.slice(1), [120, 0, 400, 400, 0, 0, 128, 128], 'center-crop picture before local storage');
  assert.ok(updates > 0);
  context.choosePixelRoomPicture();
  input.files[0].size = 11 * 1024 * 1024;
  await input.onchange();
  assert.match(notices.at(-1), /10MB/);
  context.loadPixelRoomPicture('');
  assert.equal(vm.runInContext('pixelRoomPicture', context), null);
  context.document = originalDocument;
  context.updatePixelRoom = originalUpdate;
}
checkRoomPictures().then(checkWeatherRequests).catch((error) => { console.error(error); process.exitCode = 1; });
