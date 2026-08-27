const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const modules = [
  { name: 'parameter-logo-assets', file: path.join(root, 'src', 'parameter-logo-assets.module.js') },
  { name: 'parameter-image', file: path.join(root, 'src', 'parameter-image.module.js') },
  { name: 'cloud-assets', file: path.join(root, 'src', 'cloud-assets.module.js') },
  { name: 'icon-assets', file: path.join(root, 'src', 'icon-assets.module.js') },
  { name: 'notifications', file: path.join(root, 'src', 'notifications.module.js') },
  { name: 'desktop-bridge', file: path.join(root, 'src', 'desktop-bridge.module.js') },
  { name: 'ui-loader', file: path.join(root, 'src', 'ui-loader.module.js') },
  {
    name: 'product-development-ingredient-templates',
    file: path.join(root, 'src', 'product-development-ingredient-templates.module.js'),
    requiredSourceMarkers: ['PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES'],
  },
  {
    name: 'product-development',
    file: path.join(root, 'src', 'product-development.module.js'),
    requiredSourceMarkers: [
      'function setupProductDevelopmentTaskTabs',
      'function productDevelopmentTaskTabsHtml',
      'function renderProductDevelopmentTaskDetail',
      'function loadProductDevelopmentTaskCache',
      'function saveProductDevelopmentTaskCache',
    ],
  },
  { name: 'magic-upload-actions', file: path.join(root, 'src', 'magic-upload-actions.module.js') },
];
const requestedModules = new Set(process.argv.slice(2));
const selectedModules = requestedModules.size
  ? modules.filter((module) => requestedModules.has(module.name))
  : modules;
let output = fs.readFileSync(outputPath, 'utf8');

for (const module of selectedModules) {
  const start = `  // <${module.name}-module>`;
  const end = `  // </${module.name}-module>`;
  const source = fs.readFileSync(module.file, 'utf8').trimEnd();
  if (Array.isArray(module.requiredSourceMarkers)) {
    const missing = module.requiredSourceMarkers.filter((marker) => !source.includes(marker));
    if (missing.length) {
      throw new Error(`${module.name} source contract failed; missing: ${missing.join(', ')}`);
    }
  }
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escape(start)}[\\s\\S]*?${escape(end)}`);
  if (!pattern.test(output)) throw new Error(`${module.name} module markers are missing`);
  output = output.replace(pattern, `${start}\n${source}\n${end}`);
}

const startupIndex = output.indexOf('\n  injectStyle();');
if (startupIndex < 0) throw new Error('userscript startup marker is missing');
for (const name of ['cloud-assets', 'icon-assets', 'notifications', 'desktop-bridge', 'ui-loader']) {
  const moduleIndex = output.indexOf(`  // <${name}-module>`);
  if (moduleIndex < 0 || moduleIndex > startupIndex) {
    throw new Error(`${name} module must be initialized before userscript startup`);
  }
}

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Injected ${selectedModules.map((module) => path.relative(root, module.file)).join(', ')} into ${path.relative(root, outputPath)}`);
