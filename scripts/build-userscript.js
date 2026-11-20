const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const modules = [
  { name: 'network-diagnostics', file: path.join(root, 'src', 'network-diagnostics.module.js') },
  {
    name: 'trace-name-pinyin',
    file: path.join(root, 'src', 'trace-name-pinyin.module.js'),
  },
  {
    name: 'core-lazy-externals',
    file: path.join(root, 'src', 'core-lazy-externals.module.js'),
    requiredSourceMarkers: ['LAZY_EXTERNAL_SCRIPT_DEFINITIONS', 'ASSIGNED_DESIGN_TASK_ENDPOINT'],
  },
  { name: 'parameter-logo-assets', file: path.join(root, 'src', 'parameter-logo-assets.module.js') },
  { name: 'parameter-image', file: path.join(root, 'src', 'parameter-image.module.js') },
  {
    name: 'core-config',
    file: path.join(root, 'src', 'core-config.module.js'),
    requiredSourceMarkers: ['STORAGE_PREFIX', 'HOME_FEATURE_DEFINITIONS', 'CLOUD_BACKUP_API_BASE'],
  },
  { name: 'cloud-assets', file: path.join(root, 'src', 'cloud-assets.module.js') },
  { name: 'icon-assets', file: path.join(root, 'src', 'icon-assets.module.js') },
  { name: 'notifications', file: path.join(root, 'src', 'notifications.module.js') },
  { name: 'observability', file: path.join(root, 'src', 'observability.module.js') },
  { name: 'desktop-bridge', file: path.join(root, 'src', 'desktop-bridge.module.js') },
  { name: 'ui-loader', file: path.join(root, 'src', 'ui-loader.module.js') },
  { name: 'custom-select', file: path.join(root, 'src', 'custom-select.module.js') },
  {
    name: 'product-development-ingredient-templates',
    file: path.join(root, 'src', 'product-development-ingredient-templates.module.js'),
    requiredSourceMarkers: ['PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES'],
  },
  {
    name: 'product-development',
    files: [
      path.join(root, 'src', 'product-development', 'pd-foundation.module.js'),
      path.join(root, 'src', 'product-development', 'pd-permission-art.module.js'),
      path.join(root, 'src', 'product-development', 'pd-access.module.js'),
      path.join(root, 'src', 'product-development', 'pd-task-sync.module.js'),
      path.join(root, 'src', 'product-development', 'pd-prefill.module.js'),
      path.join(root, 'src', 'product-development', 'pd-pricing-drafts.module.js'),
      path.join(root, 'src', 'product-development', 'pd-dom.module.js'),
      path.join(root, 'src', 'product-development', 'pd-task-views.module.js'),
      path.join(root, 'src', 'product-development', 'pd-review-copywriting.module.js'),
      path.join(root, 'src', 'product-development', 'pd-docx-builders.module.js'),
      path.join(root, 'src', 'product-development', 'pd-copywriting-run.module.js'),
      path.join(root, 'src', 'product-development', 'pd-psd-text.module.js'),
      path.join(root, 'src', 'product-development', 'pd-file-review.module.js'),
      path.join(root, 'src', 'product-development', 'pd-one-shot.module.js'),
      path.join(root, 'src', 'product-development', 'pd-batch-runners.module.js'),
      path.join(root, 'src', 'product-development', 'pd-dispatcher.module.js'),
    ],
    requiredSourceMarkers: [
      'function setupProductDevelopmentTaskTabs',
      'function productDevelopmentTaskTabsHtml',
      'function renderProductDevelopmentTaskDetail',
      'function loadProductDevelopmentTaskCache',
      'function saveProductDevelopmentTaskCache',
    ],
  },
  { name: 'magic-upload-actions', file: path.join(root, 'src', 'magic-upload-actions.module.js') },
  {
    name: 'core-app-main',
    files: [
      path.join(root, 'src', 'core-app-bootstrap.module.js'),
      path.join(root, 'src', 'core-drawer-scan.module.js'),
      path.join(root, 'src', 'core-plm-api.module.js'),
      path.join(root, 'src', 'core-material-parse.module.js'),
      path.join(root, 'src', 'core-panel-views.module.js'),
      path.join(root, 'src', 'core-magic-upload.module.js'),
      path.join(root, 'src', 'core-ledger-detail.module.js'),
      path.join(root, 'src', 'core-tools-size-image.module.js'),
      path.join(root, 'src', 'core-ledger-workbench.module.js'),
      path.join(root, 'src', 'core-detail-copywriting.module.js'),
    ],
    requiredSourceMarkers: ['const state = {', 'function renderShell', 'function renderLedger'],
  },
  {
    name: 'core-app-runtime',
    files: [
      path.join(root, 'src', 'core-events.module.js'),
      path.join(root, 'src', 'core-upload-automation.module.js'),
      path.join(root, 'src', 'core-project-nav.module.js'),
      path.join(root, 'src', 'core-excel-export.module.js'),
      path.join(root, 'src', 'core-download-utils.module.js'),
      path.join(root, 'src', 'core-manual-sku.module.js'),
      path.join(root, 'src', 'core-insights-export.module.js'),
      path.join(root, 'src', 'core-ledger-data.module.js'),
      path.join(root, 'src', 'core-ledger-ai.module.js'),
      path.join(root, 'src', 'core-cloud-backup.module.js'),
      path.join(root, 'src', 'core-cloud-client.module.js'),
      path.join(root, 'src', 'core-insights-support.module.js'),
      path.join(root, 'src', 'core-storage.module.js'),
      path.join(root, 'src', 'core-layout-utils.module.js'),
    ],
    requiredSourceMarkers: ['function handlePanelClick', 'function escapeHtml'],
  },
];

function resolveModuleSource(module) {
  // A module may be a single `file` or an ordered `files` array; parts are
  // concatenated in order inside one marker region.
  const files = module.files || [module.file];
  // Normalize CRLF to LF so the artifact stays deterministic regardless of
  // which editor or checkout wrote the module files (core.autocrlf is on).
  const parts = files
    .map((file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trimEnd())
    .filter((part) => part.length > 0);
  const rawSource = parts.join('\n');
  const source = module.wrapSource ? module.wrapSource(rawSource) : rawSource;
  if (Array.isArray(module.requiredSourceMarkers)) {
    const missing = module.requiredSourceMarkers.filter((marker) => !source.includes(marker));
    if (missing.length) {
      throw new Error(`${module.name} source contract failed; missing: ${missing.join(', ')}`);
    }
  }
  return source;
}

// Replaces each selected module's marker region in the userscript source and
// returns the new full source. Pure: does not touch the filesystem.
function injectModules(output, selectedModules) {
  let result = output;
  for (const module of selectedModules) {
    const start = `  // <${module.name}-module>`;
    const end = `  // </${module.name}-module>`;
    const source = resolveModuleSource(module);
    const startIndex = result.indexOf(start);
    const endIndex = result.lastIndexOf(end);
    if (startIndex < 0 || endIndex < startIndex) throw new Error(`${module.name} module markers are missing`);
    result = result.slice(0, startIndex) + `${start}\n${source}\n${end}` + result.slice(endIndex + end.length);
  }
  return result;
}

function verifyOutputContract(output) {
  const requiredBootstrapMarkers = [
    'function productDevelopmentObjectCategoryHints',
  ];
  const missingBootstrapMarkers = requiredBootstrapMarkers.filter((marker) => !output.includes(marker));
  if (missingBootstrapMarkers.length) {
    throw new Error(`userscript bootstrap contract failed; missing: ${missingBootstrapMarkers.join(', ')}`);
  }

  const startupIndex = output.indexOf('\n  injectStyle();');
  if (startupIndex < 0) throw new Error('userscript startup marker is missing');
  for (const name of ['cloud-assets', 'icon-assets', 'notifications', 'desktop-bridge', 'ui-loader']) {
    const moduleIndex = output.indexOf(`  // <${name}-module>`);
    if (moduleIndex < 0 || moduleIndex > startupIndex) {
      throw new Error(`${name} module must be initialized before userscript startup`);
    }
  }
}

function main() {
  const requestedModules = new Set(process.argv.slice(2));
  const selectedModules = requestedModules.size
    ? modules.filter((module) => requestedModules.has(module.name))
    : modules;
  const output = fs.readFileSync(outputPath, 'utf8');
  const built = injectModules(output, selectedModules);
  verifyOutputContract(built);
  fs.writeFileSync(outputPath, built, 'utf8');
  const describeFiles = (module) => (module.files || [module.file]).map((file) => path.relative(root, file)).join(' + ');
  console.log(`Injected ${selectedModules.map(describeFiles).join(', ')} into ${path.relative(root, outputPath)}`);
}

if (require.main === module) {
  main();
}

module.exports = { modules, outputPath, injectModules, resolveModuleSource, verifyOutputContract };
