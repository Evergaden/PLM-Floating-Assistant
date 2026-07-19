  const UI_STYLE_ID = 'pfh-ui-styles';
  const LOCAL_UI_FALLBACK_CSS = `
    #${PANEL_ID} {
      --pfh-primary:#6d35e8;--pfh-soft:#f3efff;--pfh-text:#1f2937;--pfh-muted:#667085;--pfh-border:#d8deea;
      position:fixed;right:18px;bottom:78px;z-index:2147483647;width:686px;height:min(906px,96vh);min-width:520px;min-height:520px;
      color:var(--pfh-text);background:rgba(255,255,255,.97);border:1px solid var(--pfh-border);border-radius:16px;
      box-shadow:0 20px 65px rgba(30,24,55,.2);font:13px/1.5 Arial,"Microsoft YaHei",sans-serif;overflow:visible;
    }
    #${PANEL_ID},#${PANEL_ID} *,#${PANEL_ID}-parameter-editor-overlay,#${PANEL_ID}-parameter-editor-overlay *{box-sizing:border-box}
    #${PANEL_ID}.is-collapsed{display:none!important}
    #${PANEL_ID} .pfh-full{display:flex;height:100%;min-height:0;flex-direction:column;overflow:hidden;border-radius:inherit}
    #${PANEL_ID} .pfh-header{display:flex;min-height:68px;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--pfh-border);background:#faf9ff;cursor:move}
    #${PANEL_ID} .pfh-heading{display:flex;min-width:0;flex:1;align-items:center;gap:10px}
    #${PANEL_ID} .pfh-heading>strong{white-space:nowrap;font-size:15px}.pfh-search{display:flex;min-width:180px;flex:1}.pfh-search-box{position:relative;display:flex;min-width:0;flex:1}
    #${PANEL_ID} .pfh-search-input{width:100%;padding-right:30px;border-radius:10px 0 0 10px}.pfh-search-clear{position:absolute;right:2px;width:28px;padding:0;border:0;background:transparent}
    #${PANEL_ID} .pfh-search>button{border-radius:0 10px 10px 0;background:var(--pfh-primary);color:#fff}.pfh-actions{display:flex;align-items:center;gap:4px}
    #${PANEL_ID} .pfh-actions button{position:relative;width:36px;padding:0}.pfh-actions button>span:not(.pfh-icon){display:none}.pfh-collection-mark{width:34px;padding:0}
    #${PANEL_ID} .pfh-main{--pfh-list-width:180px;display:grid;min-width:0;min-height:0;flex:1;grid-template-columns:var(--pfh-list-width) 5px minmax(0,1fr);background:#f8f9fc}
    #${PANEL_ID} .pfh-main.is-full{grid-template-columns:minmax(0,1fr)}#${PANEL_ID} .pfh-main.is-full>.pfh-list,#${PANEL_ID} .pfh-main.is-full>.pfh-splitter{display:none}
    #${PANEL_ID} .pfh-list{display:flex;min-width:0;min-height:0;flex-direction:column;border-right:1px solid var(--pfh-border);background:#fff}
    #${PANEL_ID} .pfh-detail{position:relative;min-width:0;min-height:0;overflow:hidden}.pfh-detail-scroll{width:100%;height:100%;overflow:auto}
    #${PANEL_ID} .pfh-splitter{cursor:col-resize}.pfh-resize-handle{position:absolute;z-index:120}.pfh-resize-n,.pfh-resize-s{left:12px;right:12px;height:8px;cursor:ns-resize}
    #${PANEL_ID} .pfh-resize-n{top:-4px}.pfh-resize-s{bottom:-4px}.pfh-resize-e,.pfh-resize-w{top:12px;bottom:12px;width:8px;cursor:ew-resize}.pfh-resize-e{right:-4px}.pfh-resize-w{left:-4px}
    #${PANEL_ID} .pfh-resize-ne,#${PANEL_ID} .pfh-resize-nw,#${PANEL_ID} .pfh-resize-se,#${PANEL_ID} .pfh-resize-sw{width:14px;height:14px}.pfh-resize-ne{top:-5px;right:-5px}.pfh-resize-nw{top:-5px;left:-5px}.pfh-resize-se{right:-5px;bottom:-5px}.pfh-resize-sw{bottom:-5px;left:-5px}
    #${LAUNCHER_ID}{position:fixed;z-index:2147483647;display:inline-flex;width:86px;height:34px;align-items:center;justify-content:center;border:1px solid #d8deea;border-radius:10px;background:#fff;box-shadow:0 8px 24px rgba(35,25,70,.14);cursor:pointer}
    #${PANEL_ID} button{min-height:32px;padding:0 11px;border:1px solid var(--pfh-border);border-radius:10px;background:#fff;color:var(--pfh-text);cursor:pointer;font:inherit}
    #${PANEL_ID} button:hover{border-color:var(--pfh-primary);background:var(--pfh-soft);color:var(--pfh-primary)}#${PANEL_ID} button:disabled{cursor:not-allowed;opacity:.45}
    #${PANEL_ID} input:not([type=checkbox]):not([type=radio]):not([type=file]),#${PANEL_ID} select,#${PANEL_ID} textarea{min-height:34px;padding:6px 9px;border:1px solid var(--pfh-border);border-radius:10px;background:#fff;color:var(--pfh-text);font:inherit}
    #${PANEL_ID} input:focus,#${PANEL_ID} select:focus,#${PANEL_ID} textarea:focus{outline:0;border-color:var(--pfh-primary);box-shadow:0 0 0 3px rgba(109,53,232,.16)}
    #${PANEL_ID} .pfh-icon{display:inline-flex;width:18px;height:18px}.pfh-icon svg{width:100%;height:100%;fill:currentColor}
    #${PANEL_ID} .pfh-list-head{display:flex;min-height:46px;align-items:center;gap:7px;padding:7px;border-bottom:1px solid var(--pfh-border)}.pfh-list-head strong{min-width:0;flex:1}.pfh-sku-list-toolbar{padding:7px;border-bottom:1px solid var(--pfh-border)}
    #${PANEL_ID} .pfh-sku-scroll{min-height:0;flex:1;overflow:auto;padding:7px}.pfh-sku{display:grid;width:100%;height:auto;min-height:48px;justify-items:start;margin-bottom:5px}.pfh-sku.is-active{border-color:var(--pfh-primary);background:var(--pfh-soft)}
    #${PANEL_ID} .pfh-list-pager{padding:7px;border-top:1px solid var(--pfh-border);text-align:center}.pfh-list-pager>div,.pfh-upload-pager>div{display:flex;justify-content:center;gap:3px}
    #${PANEL_ID} .pfh-home{min-height:100%;padding:28px}.pfh-home>h2{margin:0 0 6px;font-size:25px}.pfh-home>p{color:var(--pfh-muted)}.pfh-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    #${PANEL_ID} .pfh-home-card{display:grid;height:auto;min-height:130px;align-content:start;justify-items:start;gap:5px;padding:14px;text-align:left}.pfh-home-card>.pfh-icon{color:var(--pfh-primary)}.pfh-home-card>span{color:var(--pfh-muted);font-size:10px}
    #${PANEL_ID} .pfh-section{margin:12px;padding:13px;border:1px solid var(--pfh-border);border-radius:14px;background:#fff}.pfh-section-title{display:flex;align-items:center;gap:8px}.pfh-section-title h3{margin:0}
    #${PANEL_ID} .pfh-info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pfh-row{display:grid;gap:3px;padding:9px;border:1px solid #e7e9ef;border-radius:10px}.pfh-label{color:var(--pfh-muted);font-size:10px}
    #${PANEL_ID} .pfh-settings-page,#${PANEL_ID} .pfh-ledger-page,#${PANEL_ID} .pfh-mini-tool-page,#${PANEL_ID} .pfh-size-image-page,#${PANEL_ID} .pfh-parameter-page{display:grid;gap:11px;padding:14px}
    #${PANEL_ID} .pfh-settings-card,#${PANEL_ID} .pfh-log-panel,#${PANEL_ID} .pfh-mini-tool-card{padding:12px;border:1px solid var(--pfh-border);border-radius:14px;background:#fff}
    #${PANEL_ID} .pfh-upload-body{display:flex;min-height:0;flex-direction:column;gap:9px}.pfh-upload-list{min-height:90px;overflow:auto}.pfh-upload-item,.pfh-upload-table-head{display:grid;align-items:center;gap:8px;grid-template-columns:minmax(130px,1.2fr) 90px minmax(120px,1fr) 42px}
    #${PANEL_ID} .pfh-upload-drop,#${PANEL_ID} .pfh-size-image-drop,#${PANEL_ID} .pfh-parameter-drop{display:grid;min-height:100px;place-content:center;gap:6px;padding:14px;border:1px dashed #a895e7;border-radius:14px;background:var(--pfh-soft);color:var(--pfh-primary);text-align:center}
    #${PANEL_ID} .pfh-size-image-workspace,#${PANEL_ID} .pfh-parameter-workspace{display:grid;gap:12px;grid-template-columns:minmax(250px,330px) minmax(300px,1fr)}.pfh-size-image-controls,.pfh-parameter-controls{display:grid;align-content:start;gap:9px;padding:12px;border:1px solid var(--pfh-border);border-radius:14px;background:#fff}
    #${PANEL_ID} .pfh-size-image-preview-grid,#${PANEL_ID} .pfh-parameter-previews{display:grid;gap:9px;grid-template-columns:repeat(2,minmax(0,1fr))}.pfh-size-image-preview,.pfh-parameter-preview-card{display:grid;min-height:280px;place-items:center;border:1px solid var(--pfh-border);border-radius:14px;background:#fff;overflow:hidden}.pfh-size-image-preview img,.pfh-parameter-preview-card img{max-width:100%;max-height:100%;object-fit:contain}
    #${PANEL_ID} .pfh-first-run-backdrop,#${PANEL_ID} .pfh-developer-backdrop,#${PANEL_ID} .pfh-upload-guide-modal,#${PANEL_ID} .pfh-notification-layer,#${PANEL_ID} .pfh-ledger-time-modal{position:absolute;inset:0;z-index:90;display:grid;place-items:center;padding:16px;background:rgba(30,25,50,.42)}
    #${PANEL_ID} .pfh-first-run-dialog,#${PANEL_ID} .pfh-developer-dialog,#${PANEL_ID} .pfh-upload-guide-modal>section,#${PANEL_ID} .pfh-notification-dialog,#${PANEL_ID} .pfh-ledger-time-card{width:min(520px,100%);max-height:calc(100% - 12px);overflow:auto;padding:14px;border:1px solid var(--pfh-border);border-radius:14px;background:#fff}
    #${PANEL_ID}-parameter-editor-overlay{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:12px;background:rgba(25,20,48,.64)}#${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor{display:grid;width:min(92vw,1500px);height:min(88vh,860px);gap:9px;padding:14px;grid-template-rows:auto auto minmax(180px,1fr) auto auto;border-radius:16px;background:#fbfaff}
    @media(max-width:760px){#${PANEL_ID} .pfh-home-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#${PANEL_ID} .pfh-size-image-workspace,#${PANEL_ID} .pfh-parameter-workspace{grid-template-columns:1fr}}
  `;

  function getCloudUiStyleText() {
    return typeof getCachedCloudUiStyles === 'function' ? getCachedCloudUiStyles() : '';
  }

  function setUiStyleText(cssText, source) {
    const text = String(cssText || '');
    if (!text.trim()) return false;
    let style = document.getElementById(UI_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = UI_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== text) style.textContent = text;
    style.dataset.source = source || 'fallback';
    style.dataset.version = SCRIPT_VERSION;
    return true;
  }

  function applyCloudUiStyles(cssText) {
    const text = String(cssText || '');
    if (text.length < 10000 || !text.includes('#' + PANEL_ID)) return false;
    const legacy = document.getElementById('pfh-parameter-image-styles');
    if (legacy) legacy.remove();
    return setUiStyleText(text, 'cloud-cache');
  }

  function injectStyle() {
    const cached = getCloudUiStyleText();
    if (!applyCloudUiStyles(cached)) setUiStyleText(LOCAL_UI_FALLBACK_CSS, 'local-fallback');
  }
