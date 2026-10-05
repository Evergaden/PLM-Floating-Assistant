const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const start = source.indexOf('  function alignLedgerTabIndicator(');
const code = source.slice(start, source.indexOf('  function skuDataChangeAlertHtml(', start));
const style = new Map();
const indicator = { style: { setProperty(name, value) { style.set(name, value); } } };
function button(action, left, active) {
  const classes = new Set(active ? ['active', 'is-active'] : []);
  return {
    offsetLeft: left, offsetTop: 5, offsetWidth: 180, offsetHeight: 38,
    handlers: {}, style: { setProperty() {} },
    getAttribute: () => action,
    addEventListener(name, handler) { this.handlers[name] = handler; },
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      contains: name => classes.has(name),
    },
  };
}
const buttons = [button('ledger-view-design', 5, true), button('ledger-view-finalized', 185, false)];
const tabs = {
  clientLeft: 1, clientTop: 1,
  querySelector: selector => selector === '.pfh-ledger-tab-indicator' ? indicator : buttons.find(item => item.classList.contains('is-active')),
  querySelectorAll: () => buttons,
  setAttribute() {},
};
const detail = { querySelector: () => tabs };
const context = {
  state: {},
  ResizeObserver: class {
    constructor(callback) { this.callback = callback; this.observed = []; }
    observe(node) { this.observed.push(node); }
    disconnect() { this.disconnected = true; }
  },
};
vm.createContext(context);
vm.runInContext(code, context);
context.setupLedgerTabFusion(detail);
assert.equal(style.get('left'), '4px', 'indicator shares button origin inside the tabs border');
assert.equal(style.get('top'), '4px');
assert.equal(style.get('height'), '38px');
assert.equal(style.get('width'), '180px');
assert.equal(style.get('bottom'), 'auto');
assert.match(style.get('transition'), /^left .*cubic-bezier\(.25,1.2,.35,1\),width /);
const observer = context.state.ledgerTabResizeObserver;
assert.equal(observer.observed.length, 3);
buttons[1].handlers.click();
assert.equal(style.get('left'), '184px');
assert.equal(buttons[1].classList.contains('is-active'), true);
buttons[1].offsetLeft = 235; buttons[1].offsetWidth = 230;
buttons[1].offsetHeight = 42; buttons[1].offsetTop = 7;
observer.callback();
assert.equal(style.get('left'), '234px');
assert.equal(style.get('width'), '230px');
assert.equal(style.get('top'), '6px');
assert.equal(style.get('height'), '42px');
context.setupLedgerTabFusion(detail);
assert.equal(observer.disconnected, true, 'old sizing observer is released');
const currentObserver = context.state.ledgerTabResizeObserver;
context.setupLedgerTabFusion(null);
assert.equal(currentObserver.disconnected, true);
assert.equal(context.state.ledgerTabResizeObserver, null);
console.log('Ledger tab border alignment, switching, resizing, animation, and observer cleanup passed');
