const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = process.env.PARAMETER_LOGO_SOURCE || 'C:\\Users\\Violet\\Desktop\\功能测试\\LOGOSVG';
const outputPath = path.join(root, 'src', 'parameter-logo-assets.module.js');
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

const source = `  const PARAMETER_LOGO_ASSETS = Object.freeze(${JSON.stringify(assets, null, 2)});
  const PARAMETER_LOGO_ALIASES = Object.freeze({
    'eastmoon': 'eastmoon', 'east moon': 'eastmoon', 'southmoon': 'southmoon', 'south moon': 'southmoon',
    'westmonth': 'westmonth', 'west month': 'westmonth', '한초빛': 'hanchobit', 'hanchobit': 'hanchobit'
  });

  function normalizeParameterBrandName(value) {
    return String(value || '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\\s+/g, ' ');
  }

  function getParameterLogoDataUrl(brand) {
    const normalized = normalizeParameterBrandName(brand);
    if (!normalized || /^(amz|odm|oem)$/.test(normalized)) return '';
    const compact = normalized.replace(/[^a-z0-9\\u3400-\\u9fff\\uac00-\\ud7af]+/g, '');
    const alias = PARAMETER_LOGO_ALIASES[normalized] || PARAMETER_LOGO_ALIASES[compact] || compact;
    if (PARAMETER_LOGO_ASSETS[alias]) return PARAMETER_LOGO_ASSETS[alias];
    const key = Object.keys(PARAMETER_LOGO_ASSETS).find((item) => compact.includes(item) || item.includes(compact));
    return key ? PARAMETER_LOGO_ASSETS[key] : '';
  }`;

fs.writeFileSync(outputPath, source, 'utf8');
console.log(`Generated ${path.relative(root, outputPath)} with ${Object.keys(assets).length} logos`);
