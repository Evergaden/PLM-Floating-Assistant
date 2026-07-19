  const CORE_ICON_ASSETS = Object.freeze({
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4z"></path></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"></path></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8 8 8 8M16 8l-8 8"></path></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"></path><path d="M6.2 8a7 7 0 0 1 11.5-1L20 12M4 12l2.3 5a7 7 0 0 0 11.5-1"></path></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6M10 12h9"></path></svg>',
    warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z"></path><path d="M12 9v5M12 18h.01"></path></svg>',
  });
  const DEFAULT_ICON_ASSET = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"></rect><circle cx="12" cy="12" r="2"></circle></svg>';

  function iconHtml(name) {
    const svg = ICON_ASSETS[name] || CORE_ICON_ASSETS[name] || DEFAULT_ICON_ASSET;
    return '<span class="pfh-icon pfh-icon-' + escapeHtml(name) + '">' + svg + '</span>';
  }
