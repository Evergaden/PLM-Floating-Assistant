const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const modulePath = path.join(root, 'src', 'parameter-image.module.js');
const start = '  // <parameter-image-module>';
const end = '  // </parameter-image-module>';
const output = fs.readFileSync(outputPath, 'utf8');
const moduleSource = fs.readFileSync(modulePath, 'utf8').trimEnd();
const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

if (!pattern.test(output)) throw new Error('parameter image module markers are missing');
fs.writeFileSync(outputPath, output.replace(pattern, `${start}\n${moduleSource}\n${end}`), 'utf8');
console.log(`Injected ${path.relative(root, modulePath)} into ${path.relative(root, outputPath)}`);
