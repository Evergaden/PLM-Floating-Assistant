// Guards against the dual-source-of-truth drift between src/*.module.js and
// outputs/plm-material-summary.user.js: replays the module injection in memory
// and requires the result to be byte-identical to the file on disk.
//
// In other words: `node scripts/build-userscript.js` must be a no-op on a
// synced tree. If this check fails, someone edited one side without the other
// (or edited the artifact directly) — run the build and review the diff.

const fs = require('fs');
const { modules, outputPath, injectModules } = require('./build-userscript.js');

const output = fs.readFileSync(outputPath, 'utf8');

const markerProblems = [];
for (const module of modules) {
  for (const marker of [`  // <${module.name}-module>`, `  // </${module.name}-module>`]) {
    const first = output.indexOf(marker);
    if (first < 0) {
      markerProblems.push(`missing marker: ${marker.trim()}`);
    } else if (output.indexOf(marker, first + 1) >= 0) {
      markerProblems.push(`duplicated marker: ${marker.trim()}`);
    }
  }
}
if (markerProblems.length) {
  console.error('Build-sync marker check failed:');
  for (const problem of markerProblems) console.error(`  - ${problem}`);
  process.exit(1);
}

const rebuilt = injectModules(output, modules);
if (rebuilt === output) {
  console.log(`Build-sync check passed: ${modules.length} modules in ${outputPath.split(/[\\/]/).pop()} match src/ byte-for-byte.`);
  process.exit(0);
}

console.error('Build-sync check FAILED: outputs/plm-material-summary.user.js is out of sync with src/.');
console.error('Run `node scripts/build-userscript.js`, then review the resulting diff carefully');
console.error('(lost outputs-only edits cannot be recovered from src/).');

// Show which modules drifted to make the fix obvious.
for (const module of modules) {
  const start = `  // <${module.name}-module>`;
  const end = `  // </${module.name}-module>`;
  const startIndex = output.indexOf(start);
  const endIndex = output.lastIndexOf(end);
  const region = output.slice(startIndex, endIndex + end.length);
  const singleModuleResult = injectModules(output, [module]);
  if (singleModuleResult !== output) {
    console.error(`  drifted: ${module.name} (outputs region ${region.split('\n').length} lines vs src ${module.file})`);
  }
}
process.exit(1);
