const PAGE4_ORDER = [
  'productName',
  'functions',
  'ingredients',
  'directions',
  'warning',
  'email',
  'netContent',
  'origin',
  'shelfLife',
  'distributedBy',
  'address',
  'euRep',
  'ukRep',
  'usRep',
];

const INFO_BOX_ORDER = [
  'productName',
  'functions',
  'ingredients',
  'directions',
  'warning',
  'email',
  'netContent',
  'origin',
  'shelfLife',
];

// Keep the distributor and address together in one editable paragraph box.
const ADDRESS_BOX_ORDER = ['distributedBy', 'address'];
const REP_BOX_ORDER = ['euRep', 'ukRep', 'usRep'];

const LABELS = {
  productName: 'PRODUCT NAME:',
  functions: 'FUNCTIONS:',
  ingredients: 'INGREDIENTS:',
  directions: 'DIRECTIONS OF SAFE USE:',
  warning: 'WARNING:',
  email: 'E-MAIL:',
  shelfLife: 'SHELF LIFE:',
  distributedBy: 'DISTRIBUTED BY:',
  address: 'ADDRESS:',
  euRep: 'EU REP',
  ukRep: 'UK REP',
  usRep: 'US REP',
};

const MISSING_LABELS = {
  productName: 'PRODUCT NAME',
  functions: 'FUNCTIONS',
  ingredients: 'INGREDIENTS',
  directions: 'DIRECTIONS OF SAFE USE',
  warning: 'WARNING',
  email: 'E-MAIL',
  netContent: 'NET CONTENT',
  origin: 'MADE IN COUNTRY',
  shelfLife: 'SHELF LIFE',
  distributedBy: 'DISTRIBUTED BY',
  address: 'ADDRESS',
  euRep: 'EU REP',
  ukRep: 'UK REP',
  usRep: 'US REP',
};

function clean(value) {
  return String(value == null ? '' : value)
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function linesOf(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(clean)
    .filter(Boolean);
}

function sectionMap(record) {
  return new Map((record && Array.isArray(record.sections) ? record.sections : [])
    .filter((section) => section && section.key && String(section.text || '').trim())
    .map((section) => [String(section.key), String(section.text || '')]));
}

function stripHeading(lines, pattern) {
  const result = lines.slice();
  if (!result.length) return result;
  const first = result[0];
  const match = first.match(pattern);
  if (!match) return result;
  const remainder = clean(first.slice(match[0].length).replace(/^\s*[:：]\s*/, ''));
  result.shift();
  if (remainder) result.unshift(remainder);
  return result;
}

function normalizeIngredientLines(value) {
  const text = linesOf(value).join('\n');
  return text
    .replace(/[\uFF0C,;]/g, '\u3001')
    .replace(/\s*\u3001\s*/g, '\u3001 ')
    .replace(/\u3001\s*$/g, '')
    .trim();
}

function addSegment(segments, text, bold) {
  const value = String(text == null ? '' : text);
  if (!value) return;
  const last = segments[segments.length - 1];
  if (last && last.bold === Boolean(bold)) last.text += value;
  else segments.push({ text: value, bold: Boolean(bold) });
}

function addLine(segments, text, bold) {
  addSegment(segments, text, bold);
  addSegment(segments, '\n', false);
}

function appendHeadingBody(segments, label, bodyLines, bodyBold) {
  addLine(segments, label, true);
  bodyLines.forEach((line) => addLine(segments, line, bodyBold));
}

function appendInlineLabel(segments, label, value, valueBold) {
  addSegment(segments, label + (value ? ' ' : ''), true);
  addLine(segments, value, valueBold);
}

function appendRep(segments, label, value) {
  const bodySegments = [];
  if (!appendRepBody(bodySegments, value)) return false;
  addLine(segments, label, true);
  bodySegments.forEach((segment) => addSegment(segments, segment.text, segment.bold));
  return true;
}

function appendRepBody(segments, value) {
  const body = linesOf(value);
  if (!body.length) return false;
  const heading = body[0].match(/^\s*(EU|UK|US)\s+REP\s*:?(.*)$/i);
  const remainder = heading ? clean(heading[2]) : '';
  if (remainder) addLine(segments, remainder, false);
  body.slice(heading ? 1 : 0).forEach((line) => addLine(segments, line, false));
  return true;
}

function addSimpleSection(segments, key, raw) {
  const label = LABELS[key];
  if (!label) return false;
  const pattern = new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
  const body = stripHeading(linesOf(raw), pattern);
  if (!body.length) return false;
  appendHeadingBody(segments, label, body, false);
  return true;
}

function addProductName(segments, raw) {
  const body = stripHeading(linesOf(raw), /^PRODUCT\s+NAME\s*:?\s*/i);
  if (!body.length) return false;
  appendHeadingBody(segments, LABELS.productName, body, false);
  return true;
}

function addFunctions(segments, map) {
  const body = linesOf(map && map.get('functions'));
  if (!body.length) return false;
  const heading = linesOf(map && map.get('functionsHeading')).join(' ') || LABELS.functions;
  addLine(segments, heading, false);
  body.forEach((line) => addLine(segments, line, false));
  return true;
}

function addLabelProductName(segments, raw) {
  const body = stripHeading(linesOf(raw), /^PRODUCT\s+NAME\s*:?\s*/i);
  if (!body.length) return false;
  body.forEach((line) => addLine(segments, line, false));
  return true;
}

function addIngredients(segments, map) {
  let value = map.get('ingredients') || '';
  if (!value) {
    const active = map.get('activeIngredients') || '';
    const inactive = map.get('inactiveIngredients') || '';
    value = [active, inactive].filter(Boolean).join('\n');
  }
  const body = stripHeading(linesOf(normalizeIngredientLines(value)), /^INGREDIENTS?\s*:?\s*/i);
  if (!body.length) return false;
  appendHeadingBody(segments, LABELS.ingredients, body, false);
  return true;
}

function addDirections(segments, raw) {
  const body = stripHeading(linesOf(raw), /^DIRECTIONS(?:\s+OF\s+SAFE\s+USE)?\s*:?\s*/i);
  if (!body.length) return false;
  appendHeadingBody(segments, LABELS.directions, body, false);
  return true;
}

function addWarning(segments, raw) {
  const body = stripHeading(linesOf(raw), /^WARNINGS?\s*:?\s*/i);
  if (!body.length) return false;
  appendHeadingBody(segments, LABELS.warning, body, false);
  return true;
}

function addEmail(segments, raw) {
  const body = stripHeading(linesOf(raw), /^E[-\s]?MAIL\s*:?\s*/i);
  if (!body.length) return false;
  appendHeadingBody(segments, LABELS.email, body, false);
  return true;
}

function addNetContent(segments, raw) {
  const body = stripHeading(linesOf(raw), /^(?:NET\s+CONTENT|CONTENTS?)\s*:?\s*/i);
  if (!body.length) return false;
  body.forEach((line) => addLine(segments, line, true));
  return true;
}

function addOrigin(segments, raw) {
  const body = stripHeading(linesOf(raw), /^ORIGIN\s*:?\s*/i);
  if (!body.length) return false;
  body.forEach((line) => addLine(segments, line, true));
  return true;
}

function addShelfLife(segments, raw) {
  const body = stripHeading(linesOf(raw), /^SHELF\s+LIFE\s*:?\s*/i);
  if (!body.length) return false;
  appendInlineLabel(segments, LABELS.shelfLife, body.join(' '), false);
  return true;
}

function addDistributedBy(segments, raw) {
  const value = linesOf(raw);
  if (!value.length) return false;
  const first = value.join(' ').replace(/^DISTRIBUTED\s+BY\s*:?\s*/i, '');
  appendInlineLabel(segments, LABELS.distributedBy, first, false);
  return true;
}

function addAddress(segments, raw) {
  const value = linesOf(raw);
  if (!value.length) return false;
  const first = value.join(' ').replace(/^ADDRESS\s*:?\s*/i, '');
  appendInlineLabel(segments, LABELS.address, first, false);
  return true;
}

function addLabelFacts(segments, map, missing) {
  const net = stripHeading(
    linesOf(map.get('netContent')),
    /^(?:NET\s+CONTENT|CONTENTS?)\s*:?\s*/i,
  ).join(' ');
  const origin = stripHeading(linesOf(map.get('origin')), /^ORIGIN\s*:?\s*/i).join(' ');
  if (!net) missing.push(MISSING_LABELS.netContent);
  if (!origin) missing.push(MISSING_LABELS.origin);
  if (!net && !origin) return false;
  if (net) addSegment(segments, net, true);
  if (origin) {
    if (net) addSegment(segments, '  ', false);
    addSegment(segments, origin, true);
  }
  addSegment(segments, '\n', false);
  return true;
}

function appendSection(segments, key, map, missing) {
  let complete = false;
  switch (key) {
    case 'productName':
      complete = addProductName(segments, map.get('productName'));
      break;
    case 'functions':
      complete = addFunctions(segments, map);
      break;
    case 'ingredients':
      complete = addIngredients(segments, map);
      break;
    case 'directions':
      complete = addDirections(segments, map.get('directions'));
      break;
    case 'warning':
      complete = addWarning(segments, map.get('warning'));
      break;
    case 'email':
      complete = addEmail(segments, map.get('email'));
      break;
    case 'netContent':
      complete = addNetContent(segments, map.get('netContent'));
      break;
    case 'origin':
      complete = addOrigin(segments, map.get('origin'));
      break;
    case 'shelfLife':
      complete = addShelfLife(segments, map.get('shelfLife'));
      break;
    case 'distributedBy':
      complete = addDistributedBy(segments, map.get('distributedBy'));
      break;
    case 'address':
      complete = addAddress(segments, map.get('address'));
      break;
    default:
      complete = false;
      break;
  }
  if (!complete) missing.push(MISSING_LABELS[key] || key);
  return complete;
}

function trimSegments(segments) {
  while (segments.length && !segments[segments.length - 1].text.trim()) segments.pop();
  if (segments.length) segments[segments.length - 1].text = segments[segments.length - 1].text.replace(/\n+$/, '');
  return segments;
}

function layoutFromSegments(segments) {
  const trimmed = trimSegments(segments);
  return {
    segments: trimmed,
    text: trimmed.map((segment) => segment.text).join(''),
  };
}

function appendLayoutBlock(target, layout) {
  if (!layout || !layout.segments || !layout.segments.length) return;
  if (target.length) addSegment(target, '\n', false);
  layout.segments.forEach((segment) => addSegment(target, segment.text, segment.bold));
}

function buildPage4Boxes(product) {
  const map = sectionMap(product && product.copywriting);
  const missing = [];
  const has24LanguageFunctions = Boolean(linesOf(map.get('functions')).length);
  const infoSegments = [];
  const addressSegments = [];
  INFO_BOX_ORDER.forEach((key) => appendSection(infoSegments, key, map, missing));
  ADDRESS_BOX_ORDER.forEach((key) => appendSection(addressSegments, key, map, missing));

  const reps = has24LanguageFunctions ? REP_BOX_ORDER.map((key) => {
    const bodySegments = [];
    const complete = appendRepBody(bodySegments, map.get(key));
    if (!complete) missing.push(MISSING_LABELS[key] || key);
    const trimmed = trimSegments(bodySegments);
    return {
      key,
      label: LABELS[key],
      segments: trimmed,
      text: trimmed.map((segment) => segment.text).join(''),
      complete,
    };
  }) : [];

  const info = layoutFromSegments(infoSegments);
  const address = layoutFromSegments(addressSegments);
  const combinedSegments = [];
  appendLayoutBlock(combinedSegments, info);
  appendLayoutBlock(combinedSegments, address);
  reps.forEach((rep) => {
    if (!rep.complete) return;
    if (combinedSegments.length) addSegment(combinedSegments, '\n', false);
    addLine(combinedSegments, rep.label, true);
    rep.segments.forEach((segment) => addSegment(combinedSegments, segment.text, segment.bold));
  });
  const combined = layoutFromSegments(combinedSegments);

  return {
    info,
    address,
    reps,
    missing,
    segments: combined.segments,
    text: combined.text,
  };
}

function buildLabelBoxes(product) {
  const map = sectionMap(product && product.copywriting);
  const missing = [];
  const has24LanguageFunctions = Boolean(linesOf(map.get('functions')).length);
  const nameSegments = [];
  const factsSegments = [];
  const addressSegments = [];
  if (!addLabelProductName(nameSegments, map.get('productName'))) {
    missing.push(MISSING_LABELS.productName);
  }
  addLabelFacts(factsSegments, map, missing);
  ADDRESS_BOX_ORDER.forEach((key) => appendSection(addressSegments, key, map, missing));

  const reps = has24LanguageFunctions ? REP_BOX_ORDER.map((key) => {
    const bodySegments = [];
    const complete = appendRepBody(bodySegments, map.get(key));
    if (!complete) missing.push(MISSING_LABELS[key] || key);
    const trimmed = trimSegments(bodySegments);
    return {
      key,
      label: LABELS[key],
      segments: trimmed,
      text: trimmed.map((segment) => segment.text).join(''),
      complete,
    };
  }) : [];

  const labelName = layoutFromSegments(nameSegments);
  const labelFacts = layoutFromSegments(factsSegments);
  const address = layoutFromSegments(addressSegments);
  const combinedSegments = [];
  appendLayoutBlock(combinedSegments, labelName);
  appendLayoutBlock(combinedSegments, labelFacts);
  appendLayoutBlock(combinedSegments, address);
  reps.forEach((rep) => {
    if (!rep.complete) return;
    if (combinedSegments.length) addSegment(combinedSegments, '\n', false);
    addLine(combinedSegments, rep.label, true);
    rep.segments.forEach((segment) => addSegment(combinedSegments, segment.text, segment.bold));
  });
  const combined = layoutFromSegments(combinedSegments);
  return {
    labelName,
    labelFacts,
    address,
    reps,
    missing,
    segments: combined.segments,
    text: combined.text,
  };
}

function buildPage4Layout(product, options) {
  const mode = options && options.mode ? String(options.mode) : 'box-portrait';
  const boxes = mode === 'label' || mode === 'label-wide'
    ? buildLabelBoxes(product)
    : buildPage4Boxes(product);
  return {
    ...boxes,
    boxes,
    mode,
    order: PAGE4_ORDER.slice(),
  };
}

function rangeSegments(layout) {
  let offset = 0;
  return (layout && Array.isArray(layout.segments) ? layout.segments : []).map((segment) => {
    const range = { from: offset, to: offset + segment.text.length, bold: Boolean(segment.bold) };
    offset += segment.text.length;
    return range;
  }).filter((range) => range.to > range.from);
}

if (typeof module !== 'undefined') {
  module.exports = {
    LABELS,
    MISSING_LABELS,
    PAGE4_ORDER,
    INFO_BOX_ORDER,
    ADDRESS_BOX_ORDER,
    REP_BOX_ORDER,
    buildPage4Layout,
    buildPage4Boxes,
    buildLabelBoxes,
    rangeSegments,
  };
}
