const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = process.env.PARAMETER_LOGO_SOURCE || 'C:\\Users\\Violet\\Desktop\\功能测试\\LOGOSVG';
const clientOutputPath = path.join(root, 'src', 'parameter-logo-assets.module.js');
const workerOutputPath = path.join(root, 'cloudflare', 'plm-cloud-backup', 'src', 'parameter-logo-assets.js');
const files = {
  brunizo: 'BRUNIZO.svg',
  bushaid: 'Bushaid.svg',
  docteat: 'DOCTEAT new.svg',
  eastmoon: 'EAST MOON BK.svg',
  eelhoe: 'EELHOE.svg',
  eelhope: 'Eelhope.svg',
  feimuko: 'FEIMUKO.svg',
  fluvaris: 'FLUVARIS.svg',
  gleamxi: 'Gleamxi.svg',
  googeer: 'GOOGEER b.svg',
  hanchobit: '한초빛 Hanchobit.svg',
  hoegoa: 'HOEGOA.svg',
  hoygi: 'LOGO-HOYGI.svg',
  jaysuing: 'Jaysuing.svg',
  kriath: 'KRIATH.svg',
  laniska: 'laniska bk.svg',
  nymixa: 'Nymixa.svg',
  oceaura: 'OceAura.svg',
  oralhoe: 'oralhoe.svg',
  ouhoe: 'OUHOE.svg',
  pmoox: 'PMOOX-BK.svg',
  roxelis: 'Roxelis.svg',
  southmoon: 'South Moon.svg',
  viareline: 'Viareline bk.svg',
  vorvita: 'VORVITA bk.svg',
  westmonth: 'West Month.svg',
  wiieey: 'WIIEEY.svg',
  wiyun: 'WIYUN.svg',
  woodsleep: 'Woodsleep.svg',
  ximonth: 'ximonth.svg',
  zyvarn: 'Zyvarn bk.svg',
};

const assets = {};
for (const [key, fileName] of Object.entries(files)) {
  const filePath = path.join(sourceRoot, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Missing logo: ${filePath}`);
  assets[key] = `data:image/svg+xml;base64,${fs.readFileSync(filePath).toString('base64')}`;
}

const clientSource = `  const PARAMETER_LOGO_ALIASES = Object.freeze({
    'eastmoon': 'eastmoon', 'east moon': 'eastmoon', 'southmoon': 'southmoon', 'south moon': 'southmoon',
    'westmonth': 'westmonth', 'west month': 'westmonth', '한초빛': 'hanchobit', 'hanchobit': 'hanchobit'
  });

  function normalizeParameterBrandName(value) {
    return String(value || '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\\s+/g, ' ');
  }

  function getParameterLogoKey(brand) {
    const normalized = normalizeParameterBrandName(brand);
    if (!normalized || /^(amz|odm|oem)$/.test(normalized)) return '';
    const compact = normalized.replace(/[^a-z0-9\\u3400-\\u9fff\\uac00-\\ud7af]+/g, '');
    return PARAMETER_LOGO_ALIASES[normalized] || PARAMETER_LOGO_ALIASES[compact] || compact;
  }`;

const workerSource = `export const PARAMETER_LOGO_ASSETS = Object.freeze(${JSON.stringify(assets, null, 2)});\n`;

fs.writeFileSync(clientOutputPath, clientSource, 'utf8');
fs.writeFileSync(workerOutputPath, workerSource, 'utf8');
console.log(`Generated lightweight client map and ${Object.keys(assets).length} Worker logo assets`);
