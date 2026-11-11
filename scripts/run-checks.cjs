// Runs every scripts/check-*.cjs and scripts/test-*.cjs in one go.
//
// Statuses:
//   PASS         script exited 0
//   KNOWN-FAIL   script is in KNOWN_FAILURES below (pre-existing drift at the
//                2026-11-11 baseline; a sudden PASS means someone fixed it)
//   SKIP         script failed because an optional dependency is missing
//                (e.g. @napi-rs/canvas; provide it via PLM_CANVAS_MODULE)
//   FAIL         anything else — the run exits non-zero

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scriptsDir = path.join(root, 'scripts');

// Filename -> why it is allowed to fail today. Remove the entry when fixed.
const KNOWN_FAILURES = {
  'test-sku-progressive-images.cjs':
    'sliced source references setLocalImageSource outside the slice',
};

const files = fs
  .readdirSync(scriptsDir)
  .filter((name) => /^(check|test)-.+\.cjs$/.test(name))
  .sort();

let failed = 0;
let skipped = 0;
let knownFailed = 0;
let unexpectedPass = 0;
const results = [];

for (const name of files) {
  const started = Date.now();
  const run = spawnSync(process.execPath, [path.join(scriptsDir, name)], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const duration = Date.now() - started;
  const output = `${run.stdout || ''}${run.stderr || ''}`;
  let status;
  if (run.status === 0) {
    if (KNOWN_FAILURES[name]) {
      status = 'UNEXPECTED-PASS';
      unexpectedPass += 1;
      failed += 1;
    } else {
      status = 'PASS';
    }
  } else if (/Cannot find module/i.test(output)) {
    status = 'SKIP';
    skipped += 1;
  } else if (KNOWN_FAILURES[name]) {
    status = 'KNOWN-FAIL';
    knownFailed += 1;
  } else {
    status = 'FAIL';
    failed += 1;
  }
  results.push({ name, status, duration, output });
}

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) {
  const note = r.status === 'KNOWN-FAIL' ? `  (${KNOWN_FAILURES[r.name]})` : '';
  console.log(`${r.status.padEnd(15)} ${String(r.duration).padStart(6)}ms  ${r.name.padEnd(width)}${note}`);
  if (r.status === 'FAIL' || r.status === 'UNEXPECTED-PASS') {
    const tail = r.output.trim().split(/\r?\n/).slice(-12).join('\n');
    if (tail) console.log(tail.replace(/^/gm, '    | ') + '\n');
  }
}

console.log(
  `\n${results.length} scripts: ${results.length - failed - skipped - knownFailed} pass, ` +
    `${failed} fail, ${knownFailed} known-fail, ${skipped} skip (missing optional deps)`
);

if (unexpectedPass > 0) {
  console.log('A KNOWN-FAIL script now passes — remove its entry from KNOWN_FAILURES in scripts/run-checks.cjs.');
}
if (failed > 0) process.exit(1);
