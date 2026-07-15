const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const modules = [
  { name: 'parameter-logo-assets', file: path.join(root, 'src', 'parameter-logo-assets.module.js') },
  { name: 'parameter-image', file: path.join(root, 'src', 'parameter-image.module.js') },
];
let output = fs.readFileSync(outputPath, 'utf8');

for (const module of modules) {
  const start = `  // <${module.name}-module>`;
  const end = `  // </${module.name}-module>`;
  const source = fs.readFileSync(module.file, 'utf8').trimEnd();
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escape(start)}[\\s\\S]*?${escape(end)}`);
  if (!pattern.test(output)) throw new Error(`${module.name} module markers are missing`);
  output = output.replace(pattern, `${start}\n${source}\n${end}`);
}

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Injected ${modules.map((module) => path.relative(root, module.file)).join(', ')} into ${path.relative(root, outputPath)}`);
