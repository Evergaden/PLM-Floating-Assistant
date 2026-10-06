const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const start = source.indexOf('  function normalizePixelRoomTime(');
const end = source.indexOf('  function homeClockText(', start);
const context = { Intl, state: { settings: {} } };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
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
assert.equal(context.pixelRoomActivity(48, false).action, 'typing');
assert.equal(context.pixelRoomActivity(24, true).action, 'packing');

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
assert.notDeepEqual(actorFrame(0), actorFrame(1), 'typing must move visibly on consecutive seconds');
assert.notDeepEqual(actorFrame(0), actorFrame(24), 'drinking must change the character');
assert.notDeepEqual(actorFrame(24), actorFrame(32), 'stretching must change the character');
if (process.argv.includes('--preview')) {
  const sheet = createCanvas(960, 5 * 336);
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  images.forEach((canvas, i) => ctx.drawImage(canvas, 0, i * 336, 960, 336));
  fs.mkdirSync(path.join(__dirname, '../tmp'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../tmp/pixel-room-scenes.png'), sheet.toBuffer('image/png'));
}
console.log('Pixel room time boundaries, opt-in settings, scene changes and raster drawing passed');
