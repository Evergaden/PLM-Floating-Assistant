const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/ui-src/modules/lucian-preview.css'), 'utf8');
const moduleSource = fs.readFileSync(path.join(root, 'src/lucian-preview.module.js'), 'utf8');
const behavior = `
const PANEL_ID = 'plm-floating-helper';
const state = { skuFilters: {brand:'A',imageColor:'blue'}, searchQuery:'', batchExcelWorkerRunning:false };
const data = [{name:'绿色包装 · A 品牌',brand:'A',color:'green'}, {name:'蓝色包装 · B 品牌',brand:'B',color:'blue'}];
let queue = Array.from({length:6}, (_,i)=>({sku:'演示 SKU '+(i+1), status:'pending'}));
const escapeHtml = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const getFilteredSearchMatches = (tokens, filters = state.skuFilters) => data.filter(item => (!filters.brand || item.brand === filters.brand) && (!filters.imageColor || item.color === filters.imageColor));
const loadExcelBatchQueue = () => queue;
function renderSkuList() {
 const items = getFilteredSearchMatches([]);
 document.querySelector('#empty-slot').innerHTML = items.length ? '<div class="demo-results">'+items.map(item=>'<p>'+escapeHtml(item.name)+'</p>').join('')+'</div>' : lucianEmptySearchHtml([]);
}
${moduleSource}
document.querySelector('#empty-slot').addEventListener('click', event => handleLucianFilterAction(event, document.querySelector('#plm-floating-helper')));
document.querySelector('#reset-search').onclick = () => { state.skuFilters={brand:'A',imageColor:'blue'}; renderSkuList(); };
let timer = 0;
document.querySelector('#start-progress').onclick = () => {
 clearInterval(timer); queue.forEach(item=>item.status='pending'); queue[0].status='preparing'; state.batchExcelWorkerRunning=true; state.batchExcelWorkerPaused=false; state.batchExcelCurrentSku=queue[0].sku;
 syncLucianExcelProgress(document.querySelector('#plm-floating-helper'));
 let index=0;
 timer=setInterval(()=>{
  queue[index].status='ready'; index++;
  if(index<queue.length){ queue[index].status='preparing'; state.batchExcelCurrentSku=queue[index].sku; }
  else { clearInterval(timer); state.batchExcelWorkerRunning=false; state.batchExcelCurrentSku=''; }
  syncLucianExcelProgress(document.querySelector('#plm-floating-helper'));
 },1600);
};
window.addEventListener('pagehide',()=>clearInterval(timer));
document.querySelector('#theme').onclick = () => document.querySelector('#plm-floating-helper').classList.toggle('dark');
const art = (color,label) => 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="330" height="460" viewBox="0 0 330 460"><rect width="330" height="460" fill="#f4f2fb"/><ellipse cx="165" cy="376" rx="85" ry="12" fill="#d3cce8"/><rect x="89" y="88" width="152" height="280" rx="18" fill="'+color+'"/><rect x="101" y="100" width="128" height="256" rx="12" fill="none" stroke="white" opacity=".4"/><text x="165" y="184" fill="white" text-anchor="middle" font-family="Arial" font-size="28">PLM</text><text x="165" y="221" fill="white" text-anchor="middle" font-family="Arial" font-size="16">'+label+'</text><path d="M125 270h80M125 285h60" stroke="white" opacity=".7" stroke-width="5"/></svg>');
document.querySelector('#compare-slot').innerHTML=lucianComparisonHtml({parentUrl:art('#28735c','ORIGINAL'),url:art('#427bc3','REVISED')});
bindLucianComparisons(document.querySelector('#compare-slot'));
renderSkuList(); syncLucianExcelProgress(document.querySelector('#plm-floating-helper'));
`;
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PLM 交互效果验证</title><style>
body{margin:0;background:#eeebf9;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif;color:#253047}main{--pfh-theme-surface:#fff;--pfh-theme-surface-alt:#f5f3ff;--pfh-theme-text:#253047;--pfh-theme-muted:#7a82a0;--pfh-theme-primary:#7c3aed;--pfh-theme-primary-soft:#eee8ff;--pfh-theme-border:#ddd6ef;--pfh-theme-border-strong:#b7a6f4;padding:28px;min-height:100vh;box-sizing:border-box}main.dark{--pfh-theme-surface:#242131;--pfh-theme-surface-alt:#302b40;--pfh-theme-text:#f0ecff;--pfh-theme-muted:#b8b0d2;--pfh-theme-primary:#b7a4ff;--pfh-theme-primary-soft:#39304f;--pfh-theme-border:#49405d;--pfh-theme-border-strong:#8f7bb8;background:#191623;color:var(--pfh-theme-text)}header{max-width:1180px;margin:0 auto 24px}h1{font-size:25px;margin:0}header p{color:var(--pfh-theme-muted)}.demo-grid{max-width:1180px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:24px}.demo-page{min-width:0;padding:14px;border:1px solid var(--pfh-theme-border);border-radius:18px}.demo-page h2{font-size:16px;margin:0 0 4px}.demo-page>p{font-size:12px;color:var(--pfh-theme-muted)}.demo-control{cursor:pointer;border:1px solid var(--pfh-theme-border);border-radius:10px;padding:9px 14px;color:var(--pfh-theme-primary);background:var(--pfh-theme-surface);margin:4px 0 16px}.demo-results p{padding:18px;border-radius:14px;background:var(--pfh-theme-surface)}#compare-slot{display:flex;justify-content:center}@media(max-width:500px){main{padding:12px}.demo-page{padding:10px}}
${css}</style><main id="plm-floating-helper"><header><h1>PLM 交互效果验证</h1><p>这是独立演示，使用示例产品与模拟进度，不读取或修改 PLM 数据。滑杆和按钮均可实际操作。</p><button class="demo-control" id="theme">切换明暗主题</button></header><div class="demo-grid"><section class="demo-page"><h2>① 无结果筛选提示</h2><p>A 品牌＋蓝色没有交集，点击建议移除一个条件。</p><button class="demo-control" id="reset-search">重新制造无结果</button><div id="empty-slot"></div></section><section class="demo-page"><h2>② Excel 队列进度</h2><p>点击后演示等待条转为确定进度，总共六个任务。</p><button class="demo-control" id="start-progress">开始／重新演示</button><div data-lucian-excel-slot></div></section><section class="demo-page"><h2>③ 修改前后对比</h2><p>示例包装：拖动、点击、双击复位；左右方向键也可控制。</p><div id="compare-slot"></div></section></div></main><script>${behavior.replace(/<\/script/gi, '<\\/script')}</script></html>`;
const output = path.join(root, 'outputs/lucian-ui-preview.html');
fs.writeFileSync(output, html, 'utf8');
console.log('Built outputs/lucian-ui-preview.html');
