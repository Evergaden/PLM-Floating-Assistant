  function injectStyle() {
    const styleId = 'pfh-ui-styles';
    const legacyStyle = document.getElementById('pfh-parameter-image-styles');
    if (legacyStyle) legacyStyle.remove();
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.dataset.version = SCRIPT_VERSION;
    style.textContent = `
      @layer pfh-tokens, pfh-shell, pfh-components, pfh-pages, pfh-utilities;

      @layer pfh-tokens {
        #${PANEL_ID}, #${PANEL_ID}-parameter-editor-overlay, #${PANEL_ID}-upload-progress {
          --pfh-primary: #6D35E8;
          --pfh-primary-hover: #5B2BC4;
          --pfh-primary-soft: #F3EFFF;
          --pfh-text: #1F2937;
          --pfh-muted: #667085;
          --pfh-border: #D8DEEA;
          --pfh-surface: rgba(255, 255, 255, .94);
          --pfh-surface-soft: rgba(248, 249, 252, .94);
          --pfh-success: #15805F;
          --pfh-success-soft: #ECFDF5;
          --pfh-warning: #B54708;
          --pfh-warning-soft: #FFFAEB;
          --pfh-danger: #C9364F;
          --pfh-danger-soft: #FFF1F3;
          --pfh-info: #2858A5;
          --pfh-info-soft: #EFF6FF;
          --pfh-shadow-xs: 0 2px 8px rgba(35, 25, 70, .06);
          --pfh-shadow-sm: 0 8px 24px rgba(35, 25, 70, .10);
          --pfh-shadow-lg: 0 24px 70px rgba(35, 25, 70, .22);
          --pfh-focus: 0 0 0 3px rgba(109, 53, 232, .16);
          --pfh-button-h: 32px;
          --pfh-field-h: 34px;
          --pfh-radius-control: 10px;
          --pfh-radius-card: 14px;
          --pfh-radius-panel: 16px;
          color: var(--pfh-text);
          font: 13px/1.5 "MiSans", "Noto Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        #${PANEL_ID}, #${PANEL_ID} *, #${PANEL_ID}-parameter-editor-overlay, #${PANEL_ID}-parameter-editor-overlay * { box-sizing: border-box; }
        #${PANEL_ID} :where(h1, h2, h3, h4, p, ol, ul) { margin-top: 0; }
        #${PANEL_ID} :where(button, input, select, textarea) { font: inherit; }
        #${PANEL_ID} ::selection, #${PANEL_ID}-parameter-editor-overlay ::selection { background: rgba(109, 53, 232, .18); }
      }

      @layer pfh-shell {
        #${PANEL_ID} {
          position: fixed;
          right: 18px;
          bottom: 78px;
          z-index: 2147483647;
          display: block;
          width: 686px;
          height: min(906px, 96vh);
          min-width: 520px;
          min-height: 520px;
          overflow: visible;
          border: 1px solid rgba(216, 222, 234, .92);
          border-radius: var(--pfh-radius-panel);
          background: rgba(255, 255, 255, .92);
          box-shadow: 0 22px 70px rgba(25, 19, 55, .20);
          backdrop-filter: blur(22px) saturate(1.08);
          isolation: isolate;
        }
        #${PANEL_ID}.is-collapsed { display: none !important; }
        #${PANEL_ID} .pfh-full { display: flex; height: 100%; min-height: 0; flex-direction: column; overflow: hidden; border-radius: inherit; }
        #${PANEL_ID} .pfh-header {
          display: flex;
          min-height: 68px;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--pfh-border);
          background: rgba(250, 249, 255, .88);
          cursor: move;
          user-select: none;
        }
        #${PANEL_ID} .pfh-heading { display: flex; min-width: 0; flex: 1; align-items: center; gap: 10px; }
        #${PANEL_ID} .pfh-heading > strong { flex: 0 0 auto; color: #25203B; font-size: 15px; white-space: nowrap; }
        #${PANEL_ID} .pfh-search { display: flex; min-width: 180px; max-width: 560px; flex: 1; align-items: center; }
        #${PANEL_ID} .pfh-search-box { position: relative; display: flex; min-width: 0; flex: 1; }
        #${PANEL_ID} .pfh-search-input { width: 100%; padding-right: 32px; border-radius: 10px 0 0 10px; }
        #${PANEL_ID} .pfh-search-clear { position: absolute; top: 2px; right: 3px; width: 28px; min-width: 28px; border: 0; background: transparent; color: var(--pfh-muted); opacity: 0; pointer-events: none; }
        #${PANEL_ID} .pfh-search-clear.is-visible { opacity: 1; pointer-events: auto; }
        #${PANEL_ID} .pfh-search > button { min-width: 68px; border-radius: 0 10px 10px 0; border-color: var(--pfh-primary); background: var(--pfh-primary); color: #fff; }
        #${PANEL_ID} .pfh-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 4px; cursor: default; }
        #${PANEL_ID} .pfh-actions > button { position: relative; display: inline-flex; width: 38px; min-width: 38px; padding: 0; align-items: center; justify-content: center; border-color: transparent; background: transparent; color: var(--pfh-muted); }
        #${PANEL_ID} .pfh-actions > button > span:not(.pfh-icon) { display: none; }
        #${PANEL_ID} .pfh-actions > button.has-notice::after { content: ""; position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border: 2px solid #fff; border-radius: 50%; background: var(--pfh-danger); }
        #${PANEL_ID} .pfh-collection-mark { width: 34px; min-width: 34px; height: 34px; padding: 0; border: 0; border-radius: 11px; background: #B7BBC4; color: #fff; font-size: 17px; }
        #${PANEL_ID} .pfh-collection-mark.is-on { background: var(--pfh-primary); box-shadow: 0 5px 14px rgba(109, 53, 232, .22); }
        #${PANEL_ID} .pfh-main { --pfh-list-width: 180px; display: grid; min-width: 0; min-height: 0; flex: 1; grid-template-columns: var(--pfh-list-width) 5px minmax(0, 1fr); background: var(--pfh-surface-soft); }
        #${PANEL_ID} .pfh-main.is-full { grid-template-columns: minmax(0, 1fr); }
        #${PANEL_ID} .pfh-main.is-full > :where(.pfh-list, .pfh-splitter) { display: none; }
        #${PANEL_ID} .pfh-list { display: flex; min-width: 0; min-height: 0; flex-direction: column; overflow: visible; border-right: 1px solid var(--pfh-border); background: rgba(255, 255, 255, .82); }
        #${PANEL_ID} .pfh-detail { position: relative; min-width: 0; min-height: 0; overflow: hidden; background: linear-gradient(145deg, rgba(250, 248, 255, .82), rgba(247, 252, 255, .78)); container-type: inline-size; }
        #${PANEL_ID} .pfh-detail-scroll { width: 100%; height: 100%; overflow: auto; scrollbar-gutter: stable; }
        #${PANEL_ID} .pfh-splitter { position: relative; z-index: 3; width: 5px; margin-left: -3px; cursor: col-resize; }
        #${PANEL_ID} .pfh-splitter::after { content: ""; position: absolute; inset: 0 2px; background: transparent; transition: background .16s; }
        #${PANEL_ID} .pfh-splitter:hover::after, #${PANEL_ID} .pfh-splitter.is-dragging::after { background: var(--pfh-primary); }
        #${PANEL_ID} .pfh-resize-handle { position: absolute; z-index: 120; }
        #${PANEL_ID} .pfh-resize-n, #${PANEL_ID} .pfh-resize-s { left: 12px; right: 12px; height: 8px; cursor: ns-resize; }
        #${PANEL_ID} .pfh-resize-n { top: -4px; } #${PANEL_ID} .pfh-resize-s { bottom: -4px; }
        #${PANEL_ID} .pfh-resize-e, #${PANEL_ID} .pfh-resize-w { top: 12px; bottom: 12px; width: 8px; cursor: ew-resize; }
        #${PANEL_ID} .pfh-resize-e { right: -4px; } #${PANEL_ID} .pfh-resize-w { left: -4px; }
        #${PANEL_ID} :where(.pfh-resize-ne, .pfh-resize-nw, .pfh-resize-se, .pfh-resize-sw) { width: 14px; height: 14px; }
        #${PANEL_ID} .pfh-resize-ne { top: -5px; right: -5px; cursor: nesw-resize; }
        #${PANEL_ID} .pfh-resize-nw { top: -5px; left: -5px; cursor: nwse-resize; }
        #${PANEL_ID} .pfh-resize-se { right: -5px; bottom: -5px; cursor: nwse-resize; }
        #${PANEL_ID} .pfh-resize-sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
        #${LAUNCHER_ID} {
          position: fixed;
          z-index: 2147483647;
          display: inline-flex;
          width: 86px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--pfh-border, #D8DEEA);
          border-radius: 10px;
          background: rgba(255, 255, 255, .96);
          box-shadow: 0 8px 24px rgba(35, 25, 70, .14);
          color: #403657;
          cursor: pointer;
          font: 600 13px/1 "Microsoft YaHei", sans-serif;
        }
        #${LAUNCHER_ID}:hover { border-color: #6D35E8; background: #F3EFFF; color: #5B2BC4; transform: translateY(-1px); }
      }

      @layer pfh-components {
        #${PANEL_ID} button, #${PANEL_ID}-parameter-editor-overlay button {
          display: inline-flex;
          min-width: 0;
          height: var(--pfh-button-h);
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 12px;
          border: 1px solid var(--pfh-border);
          border-radius: var(--pfh-radius-control);
          background: #fff;
          color: #423A55;
          cursor: pointer;
          font-weight: 650;
          line-height: 1;
          text-decoration: none;
          transition: border-color .16s, background .16s, color .16s, box-shadow .16s, transform .16s;
        }
        #${PANEL_ID} button:hover, #${PANEL_ID}-parameter-editor-overlay button:hover { border-color: var(--pfh-primary); background: var(--pfh-primary-soft); color: var(--pfh-primary-hover); box-shadow: var(--pfh-shadow-xs); transform: translateY(-1px); }
        #${PANEL_ID} button:focus-visible, #${PANEL_ID}-parameter-editor-overlay button:focus-visible { outline: 0; border-color: var(--pfh-primary); box-shadow: var(--pfh-focus); }
        #${PANEL_ID} button:active, #${PANEL_ID}-parameter-editor-overlay button:active { transform: translateY(0); box-shadow: none; }
        #${PANEL_ID} button:disabled, #${PANEL_ID} button[aria-disabled="true"], #${PANEL_ID}-parameter-editor-overlay button:disabled { cursor: not-allowed; opacity: .45; box-shadow: none; transform: none; }
        #${PANEL_ID} button:disabled:hover, #${PANEL_ID} button[aria-disabled="true"]:hover, #${PANEL_ID}-parameter-editor-overlay button:disabled:hover { border-color: var(--pfh-border); background: #fff; color: #423A55; box-shadow: none; transform: none; }
        #${PANEL_ID} :where(.pfh-btn-primary, button.is-primary, .pfh-actions-primary), #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-apply { border-color: var(--pfh-primary); background: var(--pfh-primary); color: #fff; }
        #${PANEL_ID} :where(.pfh-btn-primary, button.is-primary, .pfh-actions-primary):hover, #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-apply:hover { border-color: var(--pfh-primary-hover); background: var(--pfh-primary-hover); color: #fff; }
        #${PANEL_ID} :where(.pfh-btn-secondary, button.is-secondary) { border-color: #CFC4F2; background: var(--pfh-primary-soft); color: var(--pfh-primary-hover); }
        #${PANEL_ID} :where(.pfh-btn-ghost, .pfh-btn-icon) { background: transparent; }
        #${PANEL_ID} :where(.pfh-btn-danger, button.is-danger) { border-color: #F1B8C2; background: var(--pfh-danger-soft); color: var(--pfh-danger); }
        #${PANEL_ID} :where(.pfh-btn-danger, button.is-danger):hover { border-color: var(--pfh-danger); background: var(--pfh-danger); color: #fff; }
        #${PANEL_ID} .pfh-page-back { width: 32px; min-width: 32px; height: 32px; padding: 0; flex: 0 0 32px; border-color: #D6CFEC; background: rgba(255, 255, 255, .9); color: var(--pfh-primary); }
        #${PANEL_ID} .pfh-page-back .pfh-icon { width: 16px; height: 16px; }
        #${PANEL_ID} .pfh-icon { display: inline-flex; width: 18px; height: 18px; flex: 0 0 auto; align-items: center; justify-content: center; }
        #${PANEL_ID} .pfh-icon svg { display: block; width: 100%; height: 100%; fill: currentColor; }
        #${PANEL_ID} :where(input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea), #${PANEL_ID}-parameter-editor-overlay :where(input, select, textarea) {
          width: 100%;
          min-width: 0;
          min-height: var(--pfh-field-h);
          padding: 6px 10px;
          border: 1px solid var(--pfh-border);
          border-radius: var(--pfh-radius-control);
          outline: 0;
          background: #fff;
          color: var(--pfh-text);
          transition: border-color .16s, box-shadow .16s, background .16s;
        }
        #${PANEL_ID} :where(input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea):hover, #${PANEL_ID}-parameter-editor-overlay :where(input, select, textarea):hover { border-color: #B8AAE6; }
        #${PANEL_ID} :where(input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea):focus, #${PANEL_ID}-parameter-editor-overlay :where(input, select, textarea):focus { border-color: var(--pfh-primary); box-shadow: var(--pfh-focus); }
        #${PANEL_ID} textarea { resize: vertical; line-height: 1.55; }
        #${PANEL_ID} :where(input[type="checkbox"], input[type="radio"]) { accent-color: var(--pfh-primary); }
        #${PANEL_ID} :where(.pfh-section, .pfh-card, .pfh-settings-card, .pfh-mini-tool-card, .pfh-log-panel, .pfh-rule-panel, .pfh-readiness-panel) { border: 1px solid var(--pfh-border); border-radius: var(--pfh-radius-card); background: var(--pfh-surface); box-shadow: var(--pfh-shadow-xs); }
        #${PANEL_ID} :where(.pfh-section-title, .pfh-page-header, .pfh-settings-card-head, .pfh-log-head) { display: flex; align-items: center; gap: 9px; }
        #${PANEL_ID} :where(.pfh-section-title, .pfh-page-header) h3 { min-width: 0; margin: 0; color: var(--pfh-text); font-size: 16px; }
        #${PANEL_ID} :where(.pfh-status, .pfh-excel-status, .pfh-size-image-status, .pfh-parameter-status, .pfh-notification-status, .pfh-cloud-status, .pfh-insight-status) { padding: 8px 10px; border: 1px solid #BCD9EF; border-radius: var(--pfh-radius-control); background: var(--pfh-info-soft); color: var(--pfh-info); font-size: 11px; overflow-wrap: anywhere; }
        #${PANEL_ID} :where(.pfh-status, .pfh-excel-status, .pfh-size-image-status, .pfh-parameter-status, .pfh-notification-status).is-success { border-color: #A7E3D0; background: var(--pfh-success-soft); color: var(--pfh-success); }
        #${PANEL_ID} :where(.pfh-status, .pfh-excel-status, .pfh-size-image-status, .pfh-parameter-status, .pfh-notification-status).is-error { border-color: #F3C0C9; background: var(--pfh-danger-soft); color: var(--pfh-danger); }
        #${PANEL_ID} :where(.pfh-status, .pfh-excel-status, .pfh-size-image-status, .pfh-parameter-status, .pfh-notification-status).is-warning { border-color: #F1D39A; background: var(--pfh-warning-soft); color: var(--pfh-warning); }
        #${PANEL_ID} .pfh-empty { display: grid; min-height: 120px; place-items: center; padding: 20px; color: var(--pfh-muted); text-align: center; }
        #${PANEL_ID} .pfh-dropzone { position: relative; display: grid; min-height: 108px; place-content: center; gap: 6px; overflow: hidden; padding: 16px; border: 1px dashed #A895E7; border-radius: var(--pfh-radius-card); background: rgba(243, 239, 255, .72); color: var(--pfh-primary); text-align: center; cursor: pointer; }
        #${PANEL_ID} .pfh-dropzone:hover, #${PANEL_ID} .pfh-dropzone:focus-visible, #${PANEL_ID} .pfh-dropzone.is-paste-received { border-color: var(--pfh-primary); background: var(--pfh-primary-soft); box-shadow: var(--pfh-focus); transform: translateY(-1px); }
        #${PANEL_ID} .pfh-dropzone:disabled, #${PANEL_ID} .pfh-dropzone.is-busy, #${PANEL_ID} .pfh-dropzone.is-processing { cursor: wait; opacity: .64; transform: none; }
        #${PANEL_ID} .pfh-dropzone strong { color: var(--pfh-text); font-size: 13px; }
        #${PANEL_ID} .pfh-dropzone span:not(.pfh-icon) { color: var(--pfh-muted); font-size: 11px; font-weight: 400; line-height: 1.55; }
        #${PANEL_ID} .pfh-dropzone .pfh-icon { width: 24px; height: 24px; margin: 0 auto; }
        #${PANEL_ID} .pfh-dropzone.is-compact { min-height: 76px; }
        #${PANEL_ID} .pfh-dropzone.is-large { min-height: 128px; }
        #${PANEL_ID} :where(.pfh-first-run-backdrop, .pfh-developer-backdrop, .pfh-upload-guide-modal, .pfh-notification-layer, .pfh-ledger-time-modal) { position: absolute; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; border-radius: inherit; background: rgba(30, 25, 50, .40); backdrop-filter: blur(7px); }
        #${PANEL_ID} :where(.pfh-first-run-dialog, .pfh-developer-dialog, .pfh-upload-guide-modal > section, .pfh-notification-dialog, .pfh-ledger-time-card) { width: min(520px, 100%); max-height: calc(100% - 12px); overflow: auto; border: 1px solid var(--pfh-border); border-radius: var(--pfh-radius-card); background: #fff; box-shadow: var(--pfh-shadow-lg); }
        #${PANEL_ID} .pfh-toast, #${PANEL_ID} .pfh-note-toast { position: absolute; right: 16px; bottom: 16px; z-index: 130; max-width: min(360px, calc(100% - 32px)); padding: 10px 13px; border: 1px solid #D6CFEC; border-radius: 10px; background: rgba(255, 255, 255, .98); box-shadow: var(--pfh-shadow-sm); color: #473B62; }
        #${PANEL_ID} .pfh-import-file, #${PANEL_ID} :where(.pfh-upload-file, .pfh-size-image-file-input, .pfh-parameter-file) { display: none; }
      }

      @layer pfh-pages {
        #${PANEL_ID} .pfh-list-head { display: grid; min-height: 48px; align-items: center; gap: 7px; padding: 8px; grid-template-columns: 32px minmax(0, 1fr) auto; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-list-head strong { min-width: 0; overflow: hidden; color: var(--pfh-text); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        #${PANEL_ID} .pfh-list-head > span { color: var(--pfh-muted); font-size: 10px; white-space: nowrap; }
        #${PANEL_ID} .pfh-sku-list-toolbar { display: grid; gap: 7px; padding: 8px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-sku-view-switch { display: grid; grid-template-columns: 1fr 1fr; padding: 2px; border-radius: 9px; background: #F0F2F6; }
        #${PANEL_ID} .pfh-sku-view-switch button { height: 27px; border: 0; background: transparent; font-size: 10px; }
        #${PANEL_ID} .pfh-sku-view-switch button.is-active { background: #fff; color: var(--pfh-primary); box-shadow: var(--pfh-shadow-xs); }
        #${PANEL_ID} .pfh-sku-sort { display: flex; align-items: center; gap: 6px; color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-export-menu { position: relative; min-width: 0; flex: 1; }
        #${PANEL_ID} .pfh-export-menu-button { width: 100%; height: 28px; justify-content: space-between; padding: 0 8px; font-size: 10px; }
        #${PANEL_ID} .pfh-export-menu-list { position: absolute; top: calc(100% + 5px); right: 0; z-index: 30; display: none; min-width: 130px; padding: 5px; border: 1px solid var(--pfh-border); border-radius: 10px; background: #fff; box-shadow: var(--pfh-shadow-sm); }
        #${PANEL_ID} .pfh-export-menu.is-open .pfh-export-menu-list { display: grid; gap: 3px; }
        #${PANEL_ID} .pfh-export-menu-list button { justify-content: flex-start; border: 0; font-size: 11px; }
        #${PANEL_ID} .pfh-export-menu-list button.is-active { background: var(--pfh-primary-soft); color: var(--pfh-primary); }
        #${PANEL_ID} .pfh-sku-scroll { min-height: 0; flex: 1; overflow: auto; padding: 7px; }
        #${PANEL_ID} .pfh-sku { display: grid; width: 100%; height: auto; min-height: 50px; justify-items: start; gap: 3px; margin-bottom: 6px; padding: 8px 9px; border-color: transparent; background: transparent; text-align: left; }
        #${PANEL_ID} .pfh-sku > span { display: flex; width: 100%; align-items: center; gap: 5px; }
        #${PANEL_ID} .pfh-sku b { min-width: 0; overflow: hidden; font-size: 11px; text-overflow: ellipsis; }
        #${PANEL_ID} .pfh-sku small { width: 100%; overflow: hidden; color: var(--pfh-muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
        #${PANEL_ID} .pfh-sku.is-active { border-color: #CFC4F2; background: var(--pfh-primary-soft); color: var(--pfh-primary-hover); }
        #${PANEL_ID} .pfh-sku.is-pinned b::before { content: "•"; margin-right: 4px; color: var(--pfh-primary); }
        #${PANEL_ID} .pfh-sku-waterfall-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
        #${PANEL_ID} .pfh-sku-waterfall-card { display: grid; height: auto; min-height: 112px; padding: 5px; grid-template-rows: 78px auto; }
        #${PANEL_ID} .pfh-sku-waterfall-card.is-active { border-color: var(--pfh-primary); background: var(--pfh-primary-soft); }
        #${PANEL_ID} .pfh-sku-waterfall-thumb { display: grid; place-items: center; overflow: hidden; border-radius: 8px; background: #F4F5F8; }
        #${PANEL_ID} .pfh-sku-waterfall-thumb img { width: 100%; height: 100%; object-fit: contain; }
        #${PANEL_ID} .pfh-sku-waterfall-meta { min-width: 0; padding: 5px 2px 1px; overflow: hidden; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
        #${PANEL_ID} :where(.pfh-list-pager, .pfh-upload-pager) { display: flex; min-height: 42px; align-items: center; justify-content: center; padding: 6px; border-top: 1px solid var(--pfh-border); }
        #${PANEL_ID} :where(.pfh-list-pager, .pfh-upload-pager) > div { display: flex; align-items: center; gap: 3px; }
        #${PANEL_ID} :where(.pfh-list-pager, .pfh-upload-pager) button, #${PANEL_ID} :where(.pfh-list-pager, .pfh-upload-pager) b { width: 27px; min-width: 27px; height: 27px; padding: 0; font-size: 10px; }
        #${PANEL_ID} :where(.pfh-list-pager, .pfh-upload-pager) b { display: grid; place-items: center; border-radius: 8px; background: var(--pfh-primary); color: #fff; }
        #${PANEL_ID} .pfh-search-result-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 7px; color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-search-result-toolbar button { height: 26px; padding: 0 8px; font-size: 9px; }

        #${PANEL_ID} .pfh-home { position: relative; min-height: 100%; padding: clamp(20px, 4vw, 42px); overflow: hidden; }
        #${PANEL_ID} .pfh-home > h2 { position: relative; z-index: 1; margin: 0 0 6px; color: #292142; font-size: clamp(22px, 3vw, 30px); }
        #${PANEL_ID} .pfh-home > p { position: relative; z-index: 1; max-width: 680px; margin: 0 0 18px; color: var(--pfh-muted); }
        #${PANEL_ID} .pfh-home-orbit { position: absolute; top: -55px; right: -45px; width: 250px; height: 250px; border-radius: 50%; background: radial-gradient(circle, rgba(109, 53, 232, .12), transparent 66%); pointer-events: none; }
        #${PANEL_ID} .pfh-home-orbit .wave { position: absolute; inset: calc(var(--i, 0) * 18px); border: 1px solid rgba(109, 53, 232, .09); border-radius: 50%; }
        #${PANEL_ID} .pfh-home-stats { position: relative; z-index: 1; display: inline-grid; min-width: 170px; margin-bottom: 20px; padding: 10px 13px; grid-template-columns: auto 1fr; gap: 0 10px; border: 1px solid var(--pfh-border); border-radius: 12px; background: rgba(255, 255, 255, .78); }
        #${PANEL_ID} .pfh-home-stats span { color: var(--pfh-primary); font-size: 9px; font-weight: 800; letter-spacing: .12em; }
        #${PANEL_ID} .pfh-home-stats b { grid-row: span 2; font-size: 26px; }
        #${PANEL_ID} .pfh-home-stats em { color: var(--pfh-muted); font-size: 10px; font-style: normal; }
        #${PANEL_ID} .pfh-home-grid { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        #${PANEL_ID} .pfh-home-card { display: grid; height: auto; min-height: 132px; align-content: start; justify-items: start; gap: 5px; padding: 14px; border-color: rgba(216, 222, 234, .9); background: rgba(255, 255, 255, .82); text-align: left; }
        #${PANEL_ID} .pfh-home-card > .pfh-icon { width: 24px; height: 24px; margin-bottom: 4px; color: var(--pfh-primary); }
        #${PANEL_ID} .pfh-home-card small { color: var(--pfh-primary); font-size: 9px; font-weight: 800; letter-spacing: .06em; }
        #${PANEL_ID} .pfh-home-card-title { display: flex; align-items: center; gap: 6px; color: var(--pfh-text); font-size: 13px; }
        #${PANEL_ID} .pfh-home-card > span { color: var(--pfh-muted); font-size: 10px; font-weight: 400; line-height: 1.45; }
        #${PANEL_ID} .pfh-beta-badge { padding: 2px 5px; border-radius: 999px; background: var(--pfh-primary-soft); color: var(--pfh-primary); font-size: 8px; font-style: normal; }

        #${PANEL_ID} .pfh-section { margin: 12px; padding: 14px; }
        #${PANEL_ID} .pfh-section + .pfh-section { margin-top: 0; }
        #${PANEL_ID} .pfh-product-hero { display: grid; min-height: 86px; align-items: center; gap: 12px; padding: 14px; grid-template-columns: 64px minmax(0, 1fr); border-bottom: 1px solid var(--pfh-border); background: rgba(255, 255, 255, .72); }
        #${PANEL_ID} .pfh-title-meta { display: grid; min-width: 0; align-items: center; gap: 12px; grid-column: 1 / -1; grid-template-columns: 64px minmax(0, 1fr); }
        #${PANEL_ID} .pfh-product-thumb, #${PANEL_ID} .pfh-thumb-frame { display: grid; width: 64px; height: 64px; place-items: center; overflow: hidden; border: 1px solid var(--pfh-border); border-radius: 12px; background: #fff; }
        #${PANEL_ID} :where(.pfh-product-thumb, .pfh-thumb-frame) img { width: 100%; height: 100%; object-fit: contain; }
        #${PANEL_ID} .pfh-product-title-copy { min-width: 0; }
        #${PANEL_ID} .pfh-product-title-copy > span { color: var(--pfh-primary); font-size: 10px; font-weight: 800; }
        #${PANEL_ID} .pfh-product-title-copy > strong { display: block; margin: 3px 0 8px; overflow: hidden; font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
        #${PANEL_ID} .pfh-product-title-copy h3 { margin: 0 0 4px; font-size: 16px; }
        #${PANEL_ID} .pfh-product-title-copy p { margin: 0; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID} .pfh-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        #${PANEL_ID} .pfh-row { position: relative; display: grid; min-width: 0; gap: 3px; padding: 9px 10px; border: 1px solid #E6E9F0; border-radius: 10px; background: #fff; }
        #${PANEL_ID} .pfh-label { color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-value { min-width: 0; overflow-wrap: anywhere; font-weight: 650; }
        #${PANEL_ID} .pfh-row-actions, #${PANEL_ID} .pfh-title-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        #${PANEL_ID} .pfh-row-actions button { height: 27px; padding: 0 8px; font-size: 10px; }
        #${PANEL_ID} .pfh-graphic-table { display: grid; gap: 6px; }
        #${PANEL_ID} .pfh-graphic-title { color: var(--pfh-muted); font-size: 11px; font-weight: 700; }
        #${PANEL_ID} .pfh-note { padding: 10px; border-left: 3px solid var(--pfh-primary); border-radius: 8px; background: var(--pfh-primary-soft); color: #514866; }
        #${PANEL_ID} .pfh-note { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 12px 12px; }
        #${PANEL_ID} .pfh-note > button { width: 28px; min-width: 28px; height: 28px; padding: 0; }
        #${PANEL_ID} .pfh-note-source { color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-note-toast { display: none; }
        #${PANEL_ID} .pfh-note-toast.is-visible { display: block; }
        #${PANEL_ID} .pfh-inline-edit { display: flex; align-items: center; gap: 6px; }
        #${PANEL_ID} .pfh-inline-edit input { width: 90px; }
        #${PANEL_ID} .pfh-excel-options-row { min-width: 0; }
        #${PANEL_ID} .pfh-excel-form { display: grid; align-items: center; gap: 7px; padding: 9px; grid-template-columns: minmax(120px, 1fr) 92px 32px auto minmax(120px, 1.4fr); border: 1px solid var(--pfh-border); border-radius: 11px; background: #F8F9FB; }
        #${PANEL_ID} .pfh-excel-form > button { padding: 0 9px; }
        #${PANEL_ID} .pfh-excel-form > button:nth-of-type(2) { border-color: var(--pfh-primary); background: var(--pfh-primary); color: #fff; }
        #${PANEL_ID} .pfh-excel-status.is-good { border-color: #A7E3D0; background: var(--pfh-success-soft); color: var(--pfh-success); }
        #${PANEL_ID} .pfh-excel-status.is-bad { border-color: #F1D39A; background: var(--pfh-warning-soft); color: var(--pfh-warning); }
        #${PANEL_ID} .pfh-smart-recommend { display: grid; gap: 4px; margin-top: 8px; padding: 10px; border: 1px solid #D9D2EF; border-radius: 10px; background: var(--pfh-primary-soft); }
        #${PANEL_ID} .pfh-smart-recommend > span { color: #514866; }
        #${PANEL_ID} .pfh-smart-recommend :where(small, em) { color: var(--pfh-muted); font-size: 9px; font-style: normal; }
        #${PANEL_ID} .pfh-toy-copywriting-feedback { margin-top: 8px; padding: 8px 10px; border-radius: 10px; background: var(--pfh-info-soft); color: var(--pfh-info); }

        #${PANEL_ID} .pfh-settings-page { display: grid; gap: 11px; margin: 0; padding: 14px; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
        #${PANEL_ID} .pfh-settings-hero { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; border: 1px solid #D9D2EF; border-radius: var(--pfh-radius-card); background: var(--pfh-primary-soft); }
        #${PANEL_ID} .pfh-settings-hero h3 { margin: 0 0 3px; font-size: 18px; }
        #${PANEL_ID} .pfh-settings-hero p { margin: 0; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID} .pfh-settings-hero > span { color: var(--pfh-primary); font-size: 10px; font-weight: 700; white-space: nowrap; }
        #${PANEL_ID} .pfh-settings-card, #${PANEL_ID} .pfh-log-panel { display: grid; gap: 10px; padding: 12px; }
        #${PANEL_ID} .pfh-settings-card-head, #${PANEL_ID} .pfh-log-head { justify-content: space-between; }
        #${PANEL_ID} :where(.pfh-settings-card-head, .pfh-log-head) > span { color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-cloud-key, #${PANEL_ID} .pfh-tutorial-key { display: grid; gap: 5px; }
        #${PANEL_ID} :where(.pfh-cloud-key, .pfh-tutorial-key) > span { color: var(--pfh-muted); font-size: 10px; font-weight: 700; }
        #${PANEL_ID} .pfh-about-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
        #${PANEL_ID} .pfh-cloud-status, #${PANEL_ID} .pfh-insight-status { flex: 1 1 180px; }
        #${PANEL_ID} .pfh-setting-row { display: flex; flex-wrap: wrap; align-items: center; gap: 7px 12px; padding: 9px; border-radius: 10px; background: #F7F8FA; }
        #${PANEL_ID} .pfh-setting-row > span { min-width: 92px; color: var(--pfh-muted); font-size: 10px; font-weight: 700; }
        #${PANEL_ID} .pfh-setting-row label { display: inline-flex; align-items: center; gap: 5px; }
        #${PANEL_ID} .pfh-log-list, #${PANEL_ID} .pfh-rule-list { display: grid; max-height: 240px; gap: 5px; overflow: auto; }
        #${PANEL_ID} .pfh-log-row { display: grid; gap: 7px; padding: 7px; grid-template-columns: 58px 44px minmax(0, 1fr); border-radius: 8px; background: #F7F8FA; font-size: 10px; }
        #${PANEL_ID} .pfh-log-row p { margin: 0; overflow-wrap: anywhere; }
        #${PANEL_ID} :where(.pfh-readiness-row, .pfh-rule-row, .pfh-rule-mini) { display: grid; gap: 6px; padding: 8px; grid-template-columns: auto minmax(0, 1fr); border-radius: 8px; background: #F7F8FA; }
        #${PANEL_ID} :where(.pfh-readiness-row, .pfh-rule-row, .pfh-rule-mini) small { grid-column: 1 / -1; color: var(--pfh-muted); }

        #${PANEL_ID} .pfh-mini-tool-page { display: grid; gap: 14px; min-height: 100%; padding: clamp(18px, 4vw, 40px); align-content: start; }
        #${PANEL_ID} .pfh-mini-tool-head { display: grid; align-items: center; gap: 12px; grid-template-columns: 32px minmax(0, 1fr); }
        #${PANEL_ID} .pfh-mini-tool-head small { color: var(--pfh-primary); font-size: 9px; font-weight: 800; letter-spacing: .11em; }
        #${PANEL_ID} .pfh-mini-tool-head h2 { margin: 2px 0; font-size: 20px; }
        #${PANEL_ID} .pfh-mini-tool-head p { margin: 0; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID} .pfh-mini-tool-card { display: grid; max-width: 720px; gap: 10px; padding: 16px; }
        #${PANEL_ID} .pfh-mini-tool-card > label { color: var(--pfh-muted); font-size: 10px; font-weight: 700; }
        #${PANEL_ID} .pfh-mini-tool-card textarea { min-height: 110px; }
        #${PANEL_ID} .pfh-mini-tool-result { display: grid; gap: 5px; padding: 12px; border-radius: 10px; background: var(--pfh-primary-soft); }
        #${PANEL_ID} .pfh-mini-tool-result span { color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-mini-tool-result strong { color: var(--pfh-primary-hover); overflow-wrap: anywhere; }
        #${PANEL_ID} .pfh-mini-tool-actions { display: flex; justify-content: flex-end; gap: 7px; }

        #${PANEL_ID} :where(.pfh-packaging-naming-card, .pfh-sku-context-menu) { position: absolute; z-index: 100; border: 1px solid var(--pfh-border); border-radius: 12px; background: #fff; box-shadow: var(--pfh-shadow-lg); }
        #${PANEL_ID} .pfh-packaging-naming-card { display: grid; width: min(390px, calc(100% - 16px)); max-height: min(520px, calc(100% - 16px)); gap: 8px; padding: 10px; overflow: auto; }
        #${PANEL_ID} .pfh-packaging-naming-card > header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-packaging-naming-card > header > div { display: grid; }
        #${PANEL_ID} .pfh-packaging-naming-card > header span, #${PANEL_ID} .pfh-packaging-naming-subtitle span { color: var(--pfh-muted); font-size: 9px; }
        #${PANEL_ID} .pfh-packaging-naming-card > header button { width: 28px; min-width: 28px; height: 28px; padding: 0; }
        #${PANEL_ID} :where(.pfh-packaging-naming-current-list, .pfh-packaging-naming-history-list) { display: grid; gap: 5px; }
        #${PANEL_ID} :where(.pfh-packaging-naming-current, .pfh-packaging-naming-history) { display: grid; height: auto; min-height: 38px; justify-items: start; padding: 8px 9px; text-align: left; }
        #${PANEL_ID} .pfh-packaging-naming-history small { color: var(--pfh-muted); font-size: 9px; }
        #${PANEL_ID} .pfh-packaging-naming-subtitle { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
        #${PANEL_ID} .pfh-packaging-naming-empty { margin: 0; padding: 14px; color: var(--pfh-muted); text-align: center; }
        #${PANEL_ID} .pfh-sku-context-menu { display: grid; min-width: 150px; gap: 3px; padding: 5px; }
        #${PANEL_ID} .pfh-sku-context-menu button { justify-content: flex-start; border-color: transparent; }

        #${PANEL_ID}[data-view="upload"] .pfh-upload-scroll { display: flex; height: 100%; flex-direction: column; overflow: hidden; }
        #${PANEL_ID}[data-view="upload"] .pfh-upload-section { display: flex; min-height: 0; flex: 1; flex-direction: column; margin: 12px 12px 0; padding: 0; overflow: hidden; }
        #${PANEL_ID} .pfh-upload-title { min-height: 54px; padding: 10px 12px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-upload-title h3 { margin-right: auto; }
        #${PANEL_ID} .pfh-upload-title > button:not(.pfh-page-back) { height: 28px; padding: 0 9px; font-size: 10px; }
        #${PANEL_ID} .pfh-upload-status { border: 0; background: var(--pfh-primary-soft); color: var(--pfh-primary); white-space: nowrap; }
        #${PANEL_ID} .pfh-upload-body { display: flex; min-height: 0; flex: 1; flex-direction: column; gap: 9px; padding: 12px; overflow: hidden; }
        #${PANEL_ID} .pfh-upload-mode-tabs { position: relative; display: grid; width: 250px; padding: 3px; grid-template-columns: 1fr 1fr; border-radius: 10px; background: #ECEFF4; }
        #${PANEL_ID} .pfh-upload-mode-tabs button { position: relative; z-index: 1; border: 0; background: transparent; font-size: 10px; }
        #${PANEL_ID} .pfh-upload-mode-tabs button.is-active { background: #fff; color: var(--pfh-primary); box-shadow: var(--pfh-shadow-xs); }
        #${PANEL_ID} .pfh-upload-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
        #${PANEL_ID} .pfh-toy-label-sku-input { min-height: 92px; }
        #${PANEL_ID} .pfh-upload-table-head, #${PANEL_ID} .pfh-upload-item { display: grid; align-items: center; gap: 8px; grid-template-columns: minmax(130px, 1.2fr) 90px minmax(120px, 1fr) 42px; }
        #${PANEL_ID} .pfh-upload-table-head { padding: 7px 9px; border-radius: 8px; background: #F1F3F7; color: var(--pfh-muted); font-size: 9px; font-weight: 700; }
        #${PANEL_ID} .pfh-upload-list { min-height: 90px; flex: 1; overflow: auto; }
        #${PANEL_ID} .pfh-upload-item { min-height: 50px; padding: 7px 9px; border-bottom: 1px solid #EBEDF2; }
        #${PANEL_ID} .pfh-upload-item > div { display: grid; min-width: 0; }
        #${PANEL_ID} .pfh-upload-item small, #${PANEL_ID} .pfh-upload-item em { overflow: hidden; color: var(--pfh-muted); font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }
        #${PANEL_ID} .pfh-upload-item > span { padding: 4px 7px; border-radius: 999px; background: var(--pfh-info-soft); color: var(--pfh-info); font-size: 9px; text-align: center; }
        #${PANEL_ID} .pfh-upload-item > span.is-success { background: var(--pfh-success-soft); color: var(--pfh-success); }
        #${PANEL_ID} .pfh-upload-item > span.is-missing { background: var(--pfh-danger-soft); color: var(--pfh-danger); }
        #${PANEL_ID} .pfh-upload-check { width: 24px; min-width: 24px; height: 24px; padding: 0; border-radius: 7px; }
        #${PANEL_ID} .pfh-upload-check.is-checked { border-color: var(--pfh-primary); background: var(--pfh-primary); }
        #${PANEL_ID} .pfh-upload-check.is-checked::after { content: "✓"; color: #fff; }
        #${PANEL_ID} .pfh-upload-bottom { padding: 8px 12px 12px; background: var(--pfh-surface-soft); }
        #${PANEL_ID} .pfh-upload-bottom-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        #${PANEL_ID} .pfh-upload-pager { min-height: 34px; padding: 0; border: 0; gap: 8px; color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-upload-bottom-actions { display: flex; gap: 6px; }
        #${PANEL_ID} .pfh-upload-guide-modal > section > header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-upload-guide-modal > section > header h3 { margin: 0; }
        #${PANEL_ID} .pfh-upload-guide-modal > section > article { padding: 14px; }
        #${PANEL_ID} .pfh-upload-guide-modal > section p { color: var(--pfh-muted); }
        #${PANEL_ID} .pfh-upload-guide-modal footer { display: flex; justify-content: flex-end; gap: 7px; }

        #${PANEL_ID} :where(.pfh-size-image-page, .pfh-parameter-page) { display: grid; gap: 12px; min-width: 0; padding: 14px; }
        #${PANEL_ID} :where(.pfh-size-image-hero, .pfh-parameter-hero) { display: flex; align-items: center; gap: 12px; padding: 13px 15px; border: 1px solid var(--pfh-border); border-radius: var(--pfh-radius-card); background: rgba(255, 255, 255, .84); }
        #${PANEL_ID} :where(.pfh-size-image-hero-media, .pfh-parameter-hero-thumb) { display: grid; width: 58px; height: 58px; flex: 0 0 58px; place-items: center; overflow: hidden; border: 1px solid var(--pfh-border); border-radius: 12px; background: #fff; }
        #${PANEL_ID} :where(.pfh-size-image-hero-media, .pfh-parameter-hero-thumb) img { width: 100%; height: 100%; object-fit: contain; }
        #${PANEL_ID} :where(.pfh-size-image-hero-copy, .pfh-parameter-hero-copy) { min-width: 0; }
        #${PANEL_ID} :where(.pfh-size-image-hero-copy, .pfh-parameter-hero-copy) small { color: var(--pfh-primary); font-size: 9px; font-weight: 800; letter-spacing: .1em; }
        #${PANEL_ID} :where(.pfh-size-image-hero-copy, .pfh-parameter-hero-copy) h3 { margin: 3px 0; font-size: 17px; }
        #${PANEL_ID} :where(.pfh-size-image-hero-copy, .pfh-parameter-hero-copy) p { margin: 0; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID} :where(.pfh-size-image-workspace, .pfh-parameter-workspace) { display: grid; min-width: 0; gap: 12px; grid-template-columns: minmax(250px, 330px) minmax(300px, 1fr); }
        #${PANEL_ID} :where(.pfh-size-image-controls, .pfh-parameter-controls, .pfh-size-image-preview, .pfh-parameter-preview-card) { border: 1px solid var(--pfh-border); border-radius: var(--pfh-radius-card); background: rgba(255, 255, 255, .9); box-shadow: var(--pfh-shadow-xs); }
        #${PANEL_ID} :where(.pfh-size-image-controls, .pfh-parameter-controls) { display: grid; align-content: start; gap: 10px; padding: 12px; }
        #${PANEL_ID} :where(.pfh-size-image-spec, .pfh-size-image-remark-editor) { display: grid; gap: 4px; padding: 9px; border-radius: 10px; background: #F7F8FA; }
        #${PANEL_ID} :where(.pfh-size-image-spec, .pfh-size-image-remark-editor) > span { color: var(--pfh-muted); font-size: 10px; font-weight: 700; }
        #${PANEL_ID} .pfh-size-image-spec small { color: var(--pfh-muted); font-size: 9px; }
        #${PANEL_ID} .pfh-size-image-remark-editor > div { display: grid; gap: 6px; }
        #${PANEL_ID} .pfh-size-image-remark-editor label { display: grid; gap: 3px; grid-template-columns: 68px minmax(0, 1fr); align-items: center; color: var(--pfh-muted); font-size: 9px; }
        #${PANEL_ID} :where(.pfh-size-image-options, .pfh-parameter-options) { display: flex; flex-wrap: wrap; gap: 9px; padding: 8px; border-radius: 10px; background: var(--pfh-primary-soft); }
        #${PANEL_ID} :where(.pfh-size-image-options, .pfh-parameter-options) label { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; }
        #${PANEL_ID} :where(.pfh-size-image-actions, .pfh-parameter-actions) { display: grid; gap: 7px; grid-template-columns: 1fr 1fr; }
        #${PANEL_ID} .pfh-size-image-file { margin: 0; color: var(--pfh-muted); font-size: 10px; overflow-wrap: anywhere; }
        #${PANEL_ID} .pfh-size-image-preview-grid, #${PANEL_ID} .pfh-parameter-previews { display: grid; min-width: 0; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        #${PANEL_ID} .pfh-size-image-preview, #${PANEL_ID} .pfh-parameter-preview-card { position: relative; display: grid; min-height: 300px; place-items: center; overflow: hidden; padding: 10px; }
        #${PANEL_ID} :where(.pfh-size-image-preview, .pfh-parameter-preview-card) img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
        #${PANEL_ID} :where(.pfh-size-image-preview-type, .pfh-parameter-preview-card > b) { position: absolute; top: 8px; left: 8px; z-index: 2; padding: 3px 7px; border-radius: 999px; background: rgba(255, 255, 255, .94); color: var(--pfh-primary); font-size: 9px; }
        #${PANEL_ID} .pfh-size-image-placeholder { display: grid; min-height: 260px; place-items: center; align-content: center; gap: 7px; color: var(--pfh-muted); text-align: center; }
        #${PANEL_ID} .pfh-size-image-match-list { display: grid; gap: 6px; padding: 9px; border: 1px solid #F0D4A6; border-radius: 10px; background: var(--pfh-warning-soft); }
        #${PANEL_ID} .pfh-size-image-match-list > div { display: grid; align-items: center; gap: 6px; grid-template-columns: minmax(80px, 1fr) minmax(110px, 1fr) auto; }
        #${PANEL_ID} .pfh-size-image-spinner, #${PANEL_ID} .pfh-copywriting-spinner, #${PANEL_ID} .pfh-toy-copywriting-spinner { width: 20px; height: 20px; margin: auto; border: 2px solid #D6CFEC; border-top-color: var(--pfh-primary); border-radius: 50%; animation: pfh-spin .8s linear infinite; }
        #${PANEL_ID} .pfh-parameter-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        #${PANEL_ID} .pfh-parameter-fields label { display: grid; min-width: 0; gap: 3px; }
        #${PANEL_ID} .pfh-parameter-fields label.wide { grid-column: 1 / -1; }
        #${PANEL_ID} .pfh-parameter-fields label > span { color: var(--pfh-muted); font-size: 9px; font-weight: 700; }

        #${PANEL_ID} .pfh-ledger-page { display: grid; min-height: 100%; align-content: start; gap: 10px; padding: 14px; }
        #${PANEL_ID} .pfh-ledger-hero { display: grid; align-items: center; gap: 11px; padding: 13px 15px; grid-template-columns: 32px minmax(0, 1fr) auto; border: 1px solid #D9D2EF; border-radius: var(--pfh-radius-card); background: var(--pfh-primary-soft); }
        #${PANEL_ID} .pfh-ledger-hero h3 { margin: 0; font-size: 17px; }
        #${PANEL_ID} .pfh-ledger-hero p { margin: 2px 0 0; color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID} .pfh-ledger-hero > span { color: var(--pfh-primary); font-size: 10px; font-weight: 700; }
        #${PANEL_ID} .pfh-ledger-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
        #${PANEL_ID} .pfh-ledger-month { display: inline-flex; align-items: center; gap: 6px; }
        #${PANEL_ID} .pfh-ledger-month input { width: 126px; }
        #${PANEL_ID} .pfh-ledger-tabs { display: flex; padding: 3px; border-radius: 10px; background: #ECEFF4; }
        #${PANEL_ID} .pfh-ledger-tabs button { border: 0; background: transparent; font-size: 10px; }
        #${PANEL_ID} .pfh-ledger-tabs button.is-active { background: #fff; color: var(--pfh-primary); box-shadow: var(--pfh-shadow-xs); }
        #${PANEL_ID} .pfh-ledger-list { display: grid; gap: 8px; }
        #${PANEL_ID} .pfh-ledger-day { display: grid; gap: 7px; }
        #${PANEL_ID} .pfh-ledger-day > h4 { margin: 4px 0 0; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID} .pfh-ledger-item { position: relative; display: grid; min-width: 0; align-items: center; gap: 10px; padding: 10px; grid-template-columns: 52px minmax(0, 1fr); border: 1px solid var(--pfh-border); border-radius: 12px; background: #fff; box-shadow: var(--pfh-shadow-xs); }
        #${PANEL_ID} .pfh-ledger-select { position: absolute; top: 5px; left: 5px; z-index: 2; width: 20px; min-width: 20px; height: 20px; padding: 0; border-radius: 6px; }
        #${PANEL_ID} .pfh-ledger-select.is-selected { border-color: var(--pfh-primary); background: var(--pfh-primary); }
        #${PANEL_ID} .pfh-ledger-select.is-selected::after { content: "✓"; color: #fff; font-size: 10px; }
        #${PANEL_ID} .pfh-ledger-item.is-selected { border-color: var(--pfh-primary); background: var(--pfh-primary-soft); }
        #${PANEL_ID} .pfh-ledger-thumb { width: 52px; min-width: 52px; height: 52px; padding: 0; overflow: hidden; }
        #${PANEL_ID} .pfh-ledger-thumb img { width: 100%; height: 100%; object-fit: contain; }
        #${PANEL_ID} .pfh-ledger-main { display: grid; min-width: 0; gap: 5px; }
        #${PANEL_ID} .pfh-ledger-title-row, #${PANEL_ID} .pfh-ledger-bottom { display: flex; min-width: 0; align-items: center; gap: 6px; }
        #${PANEL_ID} .pfh-ledger-title { height: auto; min-width: 0; flex: 1; justify-content: flex-start; padding: 0; border: 0; background: transparent; overflow: hidden; }
        #${PANEL_ID} .pfh-ledger-title b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #${PANEL_ID} .pfh-ledger-link { width: 27px; min-width: 27px; height: 27px; padding: 0; }
        #${PANEL_ID} .pfh-ledger-status, #${PANEL_ID} .pfh-ledger-tags span { padding: 3px 6px; border-radius: 999px; background: var(--pfh-primary-soft); color: var(--pfh-primary); font-size: 8px; }
        #${PANEL_ID} .pfh-ledger-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        #${PANEL_ID} .pfh-ledger-assignment { color: var(--pfh-muted); font-size: 9px; }
        #${PANEL_ID} .pfh-ledger-edit-time { width: auto; height: 23px; margin-left: 5px; padding: 0 6px; font-size: 8px; }
        #${PANEL_ID} .pfh-ledger-price { display: inline-flex; align-items: center; gap: 3px; }
        #${PANEL_ID} .pfh-ledger-price input { width: 66px; height: 27px; min-height: 27px; padding: 3px 6px; }
        #${PANEL_ID} .pfh-ledger-bottom { justify-content: space-between; }
        #${PANEL_ID} :where(.pfh-ledger-actions, .pfh-ledger-file-actions) { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; }
        #${PANEL_ID} :where(.pfh-ledger-actions, .pfh-ledger-file-actions) button { height: 27px; padding: 0 8px; font-size: 9px; }
        #${PANEL_ID} .pfh-ledger-flow { display: flex; align-items: center; gap: 4px; color: var(--pfh-muted); font-size: 8px; }
        #${PANEL_ID} .pfh-ledger-flow em { width: 14px; height: 1px; background: var(--pfh-border); }
        #${PANEL_ID} .pfh-ledger-more { position: relative; }
        #${PANEL_ID} .pfh-ledger-overflow-menu { position: absolute; right: 0; bottom: calc(100% + 5px); z-index: 20; display: none; min-width: 150px; padding: 5px; border: 1px solid var(--pfh-border); border-radius: 10px; background: #fff; box-shadow: var(--pfh-shadow-sm); }
        #${PANEL_ID} .pfh-ledger-more.is-open .pfh-ledger-overflow-menu, #${PANEL_ID} .pfh-ledger-overflow-menu.is-open { display: grid; gap: 3px; }
        #${PANEL_ID} .pfh-ledger-time-card { display: grid; gap: 10px; padding: 14px; }
        #${PANEL_ID} .pfh-ledger-time-head, #${PANEL_ID} .pfh-ledger-time-fields, #${PANEL_ID} .pfh-ledger-time-presets, #${PANEL_ID} .pfh-ledger-time-actions { display: flex; align-items: center; gap: 7px; }
        #${PANEL_ID} .pfh-ledger-time-head { justify-content: space-between; }
        #${PANEL_ID} .pfh-ledger-time-actions { justify-content: flex-end; }

        #${PANEL_ID} .pfh-copywriting-page { display: grid; gap: 10px; padding: 14px; }
        #${PANEL_ID} .pfh-copywriting-block { overflow: hidden; border: 1px solid var(--pfh-border); border-radius: var(--pfh-radius-card); background: #fff; }
        #${PANEL_ID} .pfh-copywriting-block-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-copywriting-content { padding: 12px; color: #4B5565; line-height: 1.65; white-space: pre-wrap; }
        #${PANEL_ID} .pfh-copywriting-content { display: grid; gap: 8px; padding: 0; white-space: normal; }
        #${PANEL_ID} .pfh-copywriting-block pre { margin: 0; padding: 12px; overflow: auto; color: #4B5565; white-space: pre-wrap; font: inherit; line-height: 1.65; }
        #${PANEL_ID} .pfh-copywriting-empty { display: grid; min-height: 220px; place-items: center; align-content: center; gap: 7px; color: var(--pfh-muted); text-align: center; }
        #${PANEL_ID} .pfh-copywriting-empty p { margin: 0; }
        #${PANEL_ID} .pfh-copywriting-alert { padding: 9px 10px; border-radius: 10px; background: var(--pfh-warning-soft); color: var(--pfh-warning); }

        #${PANEL_ID} .pfh-first-run-dialog { padding: 16px; }
        #${PANEL_ID} .pfh-first-run-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
        #${PANEL_ID} .pfh-first-run-head span { padding: 3px 7px; border-radius: 999px; background: var(--pfh-primary-soft); color: var(--pfh-primary); font-size: 9px; }
        #${PANEL_ID} .pfh-first-run-dialog ol { display: grid; gap: 9px; margin: 0 0 12px; padding: 0; list-style: none; }
        #${PANEL_ID} .pfh-first-run-dialog li { display: grid; align-items: start; gap: 8px; grid-template-columns: 24px minmax(0, 1fr); }
        #${PANEL_ID} .pfh-first-run-dialog li > b { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 8px; background: var(--pfh-primary-soft); color: var(--pfh-primary); }
        #${PANEL_ID} .pfh-first-run-dialog p { margin: 0; color: var(--pfh-muted); }
        #${PANEL_ID} .pfh-first-run-dialog code { display: block; margin: 6px 0; padding: 8px; border-radius: 8px; background: #F1F3F7; overflow-wrap: anywhere; }
        #${PANEL_ID} .pfh-first-run-dialog > button { width: 100%; border-color: var(--pfh-primary); background: var(--pfh-primary); color: #fff; }
        #${PANEL_ID} .pfh-developer-dialog { display: grid; gap: 10px; padding: 16px; }
        #${PANEL_ID} .pfh-developer-dialog > div { display: flex; justify-content: space-between; }
        #${PANEL_ID} .pfh-developer-dialog p { color: var(--pfh-muted); }

        #${PANEL_ID} .pfh-notification-layer { z-index: 110; }
        #${PANEL_ID} .pfh-notification-dialog { display: flex; height: min(610px, calc(100% - 12px)); flex-direction: column; overflow: hidden; }
        #${PANEL_ID} .pfh-notification-dialog > header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-notification-dialog h3 { margin: 0; font-size: 16px; }
        #${PANEL_ID} .pfh-notification-close { width: 30px; min-width: 30px; height: 30px; padding: 0; }
        #${PANEL_ID} .pfh-notification-dialog > nav { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-notification-dialog > nav button { height: 29px; border-color: transparent; background: transparent; font-size: 10px; }
        #${PANEL_ID} .pfh-notification-dialog > nav button.is-active { background: var(--pfh-primary-soft); color: var(--pfh-primary); }
        #${PANEL_ID} .pfh-notification-dialog > nav button:last-of-type { margin-left: auto; }
        #${PANEL_ID} .pfh-notification-dialog > nav em { min-width: 18px; padding: 2px 5px; border-radius: 999px; background: var(--pfh-danger); color: #fff; font-size: 8px; font-style: normal; text-align: center; }
        #${PANEL_ID} .pfh-notification-list { min-height: 0; flex: 1; overflow: auto; padding: 10px 12px; }
        #${PANEL_ID} .pfh-notification-item { padding: 10px; border: 1px solid var(--pfh-border); border-radius: 11px; background: #fff; }
        #${PANEL_ID} .pfh-notification-item + .pfh-notification-item { margin-top: 7px; }
        #${PANEL_ID} .pfh-notification-item.is-unread { border-color: #CFC4F2; background: #FBF9FF; }
        #${PANEL_ID} .pfh-notification-item-head, #${PANEL_ID} .pfh-notification-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        #${PANEL_ID} .pfh-notification-item-head h4 { margin: 0; font-size: 12px; }
        #${PANEL_ID} .pfh-notification-item-head span { padding: 2px 6px; border-radius: 999px; background: var(--pfh-danger-soft); color: var(--pfh-danger); font-size: 8px; }
        #${PANEL_ID} .pfh-notification-content { margin: 7px 0 9px; color: #4B5565; font-size: 11px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
        #${PANEL_ID} .pfh-notification-foot { color: var(--pfh-muted); font-size: 9px; }
        #${PANEL_ID} .pfh-notification-dialog > footer { display: flex; justify-content: flex-end; padding: 9px 12px; border-top: 1px solid var(--pfh-border); }
        #${PANEL_ID} .pfh-notification-badge { position: absolute; top: 3px; right: 3px; display: none; min-width: 8px; height: 8px; padding: 0 2px; border: 2px solid #fff; border-radius: 999px; background: var(--pfh-danger); color: #fff; font-size: 7px; font-style: normal; }
        #${PANEL_ID} .pfh-actions button.has-unread .pfh-notification-badge, #${PANEL_ID} .pfh-notification-badge.is-visible { display: block; }
      }

      @layer pfh-pages {
        html.pfh-parameter-editor-open #${PANEL_ID}, html.pfh-parameter-editor-open #${LAUNCHER_ID} { visibility: hidden !important; pointer-events: none !important; }
        #${PANEL_ID}-parameter-editor-overlay { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: clamp(8px, 1.5vw, 22px); background: rgba(25, 20, 48, .64); backdrop-filter: blur(9px); }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor { display: grid; width: min(92vw, 1500px); height: min(88vh, 860px); min-width: 0; min-height: 0; gap: 10px; padding: clamp(10px, 1.2vw, 18px); grid-template-rows: auto auto minmax(180px, 1fr) auto auto; border: 1px solid rgba(167, 139, 250, .45); border-radius: var(--pfh-radius-panel); background: rgba(251, 250, 255, .985); box-shadow: var(--pfh-shadow-lg); }
        #${PANEL_ID}-parameter-editor-overlay :where(.pfh-parameter-editor-head, .pfh-parameter-editor-tools, .pfh-parameter-editor-foot) { display: flex; min-width: 0; align-items: center; gap: 8px; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-head h3 { margin: 0; font-size: 17px; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-head span { margin-left: auto; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-tools { flex-wrap: wrap; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-tools .pfh-parameter-editor-apply { margin-left: auto; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-tools button.is-active { border-color: var(--pfh-primary); background: var(--pfh-primary); color: #fff; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-stage { position: relative; display: grid; min-width: 0; min-height: 0; place-items: center; overflow: hidden; border: 1px solid var(--pfh-border); border-radius: 12px; background-color: #fff; background-image: linear-gradient(45deg, #EEF0F5 25%, transparent 25%), linear-gradient(-45deg, #EEF0F5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EEF0F5 75%), linear-gradient(-45deg, transparent 75%, #EEF0F5 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-stage.is-loading::after { content: "正在读取底图…"; position: absolute; top: 50%; left: 50%; padding: 10px 15px; border-radius: 10px; background: rgba(255, 255, 255, .96); box-shadow: var(--pfh-shadow-sm); color: var(--pfh-primary); font-weight: 800; transform: translate(-50%, -50%); }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-canvas { display: block; max-width: none; max-height: none; touch-action: none; cursor: crosshair; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-foot { flex-wrap: wrap; justify-content: space-between; color: var(--pfh-muted); font-size: 11px; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-status.is-error { color: var(--pfh-danger); font-weight: 700; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-diagnostics { min-width: 0; border: 1px solid var(--pfh-border); border-radius: 10px; background: #F8F6FF; color: var(--pfh-muted); font-size: 10px; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-diagnostics summary { padding: 7px 10px; color: var(--pfh-primary); cursor: pointer; font-weight: 800; }
        #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-diagnostics pre { max-height: 112px; margin: 0; padding: 8px 10px; overflow: auto; border-top: 1px solid var(--pfh-border); white-space: pre-wrap; word-break: break-all; font: 10px/1.45 Consolas, monospace; }
      }

      @layer pfh-utilities {
        #${PANEL_ID} .pfh-full { width: 100%; }
        #${PANEL_ID} .pfh-loading-tip { position: absolute; inset: auto 12px 12px; padding: 9px 11px; border-radius: 10px; background: rgba(255, 255, 255, .96); box-shadow: var(--pfh-shadow-sm); color: var(--pfh-muted); }
        #${PANEL_ID}-upload-progress { position: fixed; z-index: 2147483647; display: grid; align-items: center; gap: 9px; padding: 9px 11px; grid-template-columns: 30px minmax(0, 1fr) auto; border: 1px solid var(--pfh-border); border-radius: 12px; background: rgba(255, 255, 255, .97); box-shadow: var(--pfh-shadow-sm); }
        #${PANEL_ID}-upload-progress .pfh-upload-progress-icon { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 9px; background: var(--pfh-primary-soft); color: var(--pfh-primary); }
        #${PANEL_ID}-upload-progress .pfh-icon { display: inline-flex; width: 17px; height: 17px; }
        #${PANEL_ID}-upload-progress .pfh-icon svg { width: 100%; height: 100%; fill: currentColor; }
        #${PANEL_ID}-upload-progress .pfh-upload-progress-main { display: grid; min-width: 0; gap: 5px; }
        #${PANEL_ID}-upload-progress .pfh-upload-progress-main > div { height: 4px; overflow: hidden; border-radius: 999px; background: #ECEEF3; }
        #${PANEL_ID}-upload-progress .pfh-upload-progress-main > div span { display: block; height: 100%; border-radius: inherit; background: var(--pfh-primary); }
        #${PANEL_ID} .is-hidden { display: none !important; }
        @keyframes pfh-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { #${PANEL_ID} *, #${PANEL_ID}-parameter-editor-overlay * { scroll-behavior: auto; transition-duration: .01ms; animation-duration: .01ms; animation-iteration-count: 1; } }
        @media (max-width: 680px) {
          #${PANEL_ID}-parameter-editor-overlay { padding: 5px; }
          #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor { width: calc(100vw - 10px); height: calc(100vh - 10px); gap: 7px; padding: 8px; border-radius: 12px; }
          #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-head span { display: none; }
          #${PANEL_ID}-parameter-editor-overlay .pfh-parameter-editor-tools .pfh-parameter-editor-apply { margin-left: 0; }
        }
        #${PANEL_ID}.is-narrow-panel .pfh-header { flex-wrap: wrap; }
        #${PANEL_ID}.is-narrow-panel .pfh-heading { flex-basis: calc(100% - 176px); }
        #${PANEL_ID}.is-narrow-panel .pfh-home-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        #${PANEL_ID}.is-narrow-panel :where(.pfh-size-image-workspace, .pfh-parameter-workspace) { grid-template-columns: 1fr; }
        #${PANEL_ID}.is-narrow-panel .pfh-upload-table-head, #${PANEL_ID}.is-narrow-panel .pfh-upload-item { grid-template-columns: minmax(110px, 1fr) 78px minmax(90px, 1fr) 36px; }
        #${PANEL_ID}.is-narrow-panel .pfh-ledger-bottom { align-items: flex-start; flex-direction: column; }
        @container (max-width: 760px) { #${PANEL_ID} :where(.pfh-size-image-workspace, .pfh-parameter-workspace) { grid-template-columns: 1fr; } }
        @container (max-width: 560px) {
          #${PANEL_ID} .pfh-home-grid { grid-template-columns: 1fr; }
          #${PANEL_ID} .pfh-info-grid { grid-template-columns: 1fr; }
          #${PANEL_ID} .pfh-size-image-preview-grid, #${PANEL_ID} .pfh-parameter-previews { grid-template-columns: 1fr; }
        }
      }
    `;
    document.documentElement.appendChild(style);
  }
