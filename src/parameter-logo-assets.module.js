  const PARAMETER_LOGO_ALIASES = Object.freeze({
    'eastmoon': 'eastmoon', 'east moon': 'eastmoon', 'southmoon': 'southmoon', 'south moon': 'southmoon',
    'westmonth': 'westmonth', 'west month': 'westmonth', '한초빛': 'hanchobit', 'hanchobit': 'hanchobit'
  });

  function normalizeParameterBrandName(value) {
    return String(value || '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
  }

  function getParameterLogoKey(brand) {
    const normalized = normalizeParameterBrandName(brand);
    if (!normalized || /^(amz|odm|oem|dowmoo)$/.test(normalized)) return '';
    const compact = normalized.replace(/[^a-z0-9\u3400-\u9fff\uac00-\ud7af]+/g, '');
    return PARAMETER_LOGO_ALIASES[normalized] || PARAMETER_LOGO_ALIASES[compact] || compact;
  }
