const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const code = source.slice(source.indexOf('  function setupHomeCarousel('), source.indexOf('  function profileTaskProgress('));
const element = () => ({ style: {}, attrs: {}, events: {}, addEventListener(type, callback) { this.events[type] = callback; }, setAttribute(name, value) { this.attrs[name] = value; }, focus() {} });
const viewport = element(), track = element(), indicator = element(), nav = element(), carousel = element();
const slides = [element(), element(), element()];
slides.forEach((slide, index) => { slide.getAttribute = () => '模块' + index; });
const buttons = slides.map((_, index) => ({ ...element(), offsetLeft: index * 24, offsetWidth: 24 }));
nav.querySelector = () => indicator; nav.querySelectorAll = () => buttons;
carousel.querySelector = (selector) => selector.includes('viewport') ? viewport : selector.includes('track') ? track : nav;
carousel.querySelectorAll = () => slides;
const sandbox = { Array, Number, Math, Date, homeCarouselTimer: 0,
  state: { homeCarouselIndex: 0, view: 'home', settings: {} },
  window: { matchMedia: () => ({ matches: false }), clearInterval() {}, setInterval: () => 1 },
  updatePixelRoom() {}, setupPixelRoomAnimation() {}, document: { hidden: false },
};
vm.createContext(sandbox); vm.runInContext(code, sandbox);
sandbox.setupHomeCarousel({ querySelector: () => carousel });
assert.equal(indicator.style.left, '4px');
buttons[2].events.click();
assert.equal(track.style.transform, 'translate3d(-200%,0,0)');
assert.equal(track.style.transition, '', 'Use the shared spring transition when selecting a module');
assert.equal(indicator.style.left, '52px');
assert.equal(buttons[2].attrs['aria-pressed'], 'true');
assert.equal(slides[0].inert, true);
nav.events.keydown({ key: 'ArrowRight', preventDefault() {} });
assert.equal(sandbox.state.homeCarouselIndex, 0, 'Keyboard selection wraps to the first module');
sandbox.window.matchMedia = () => ({ matches: true });
buttons[1].events.click();
assert.equal(track.style.transition, 'none');
assert.equal(indicator.style.transition, 'none');
assert.doesNotMatch(source, /pfh-home-carousel-slider/);
console.log('PASS: carousel indicator, module switching, keyboard navigation and reduced motion');
