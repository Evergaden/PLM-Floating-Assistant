  // Pure text and number helpers shared by data parsing and UI formatting.
  function normalizeText(text) {
    return String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').trim();
  }

  function truncateFileName(name, max) {
    const text = String(name || '');
    if (!text) return '';
    const limit = Math.max(8, Number(max) || 30);
    if (text.length <= limit) return text;
    const head = Math.ceil(limit * 0.6);
    const tail = limit - head - 1;
    return text.slice(0, head) + '…' + text.slice(-tail);
  }

  function compactText(text) {
    return normalizeText(text).replace(/\s+/g, ' ');
  }

  function compactLabel(text) {
    return compactText(text).replace(/\*+$/g, '').trim();
  }

  function trimNumber(num) {
    return Number(num).toFixed(2).replace(/\.?0+$/, '');
  }
