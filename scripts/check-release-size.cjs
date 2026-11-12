const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.user.js'), 'utf8');
function extract(source, name) {
  const match = new RegExp('\\bfunction\\s+' + name + '\\s*\\(').exec(source);
  assert(match, 'Missing serialized function: ' + name);
  for (let end = source.indexOf('}', match.index); end >= 0; end = source.indexOf('}', end + 1)) {
    const candidate = source.slice(match.index, end + 1);
    try { new vm.Script('(' + candidate + ')'); return candidate; } catch (_) {}
  }
  throw new Error('Cannot extract ' + name);
}
const factory = extract(original, 'getParameterAnalysisWorkerSource');
const functions = factory.slice(factory.indexOf('const functions = ['), factory.indexOf('].map('));
const names = Array.from(functions.matchAll(/^\s*([\w$]+),?\s*$/gm), (match) => match[1]);
assert(names.length >= 10);
const parameterSource = fs.readFileSync(path.join(root, 'src/parameter-image.module.js'), 'utf8');
const numberStart = parameterSource.indexOf('    const number = ');
const numberEnd = parameterSource.indexOf('    const sizeText = ', numberStart);
function analyze(source, pixels) {
  const context = vm.createContext({});
  vm.runInContext(parameterSource.slice(numberStart, numberEnd), context);
  for (const name of names) vm.runInContext(extract(source, name), context);
  const factorySource = extract(source, 'getParameterAnalysisWorkerSource');
  const cache = factorySource.match(/if\s*\(\s*([\w$]+)\s*\)\s*return\s+\1/);
  assert(cache, 'Missing Worker cache');
  context[cache[1]] = '';
  vm.runInContext(factorySource, context);
  const workerSource = context.getParameterAnalysisWorkerSource();
  let result;
  const worker = vm.createContext({ self: { postMessage: (value) => { result = value; } } });
  vm.runInContext(workerSource, worker);
  worker.self.onmessage({ data: { pixelBuffer: pixels.buffer, sourceWidth: 32, sourceHeight: 32, width: 32, height: 32, session: { topologyRuleStatus: 'fallback', fields: { packageWidth: 3.2, packageLength: 3.2, packageHeight: 10 } } } });
  assert(result && result.ok, result && result.error);
  return JSON.parse(JSON.stringify(result));
}
const pixels = new Uint8ClampedArray(32 * 32 * 4);
for (let y = 3; y < 29; y += 1) for (let x = 5; x < 27; x += 1) pixels.set([180, 120, 70, 255], (y * 32 + x) * 4);
const expected = analyze(original, pixels);
for (const name of ['plm-material-summary.min.user.js', 'plm-material-summary.workspace-preview.min.user.js']) {
  const source = fs.readFileSync(path.join(root, 'outputs', name), 'utf8');
  assert(source.length <= 2097152, name + ' exceeds publishing character limit');
  for (const key of ['name', 'namespace', 'version']) {
    const pattern = new RegExp('^// @' + key + '\\s+(.+)$', 'm');
    assert.equal(source.match(pattern)[1], original.match(pattern)[1], key + ' metadata changed');
  }
  assert.deepEqual(analyze(source, pixels), expected, name + ' parameter Worker behavior changed');
  console.log(name + ': ' + source.length + ' characters; parameter Worker matches source');
}
