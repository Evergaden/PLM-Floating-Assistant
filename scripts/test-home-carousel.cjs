const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const code = source.slice(source.indexOf('  function setupHomeCarousel('), source.indexOf('  function profileTaskProgress('));
const element = () => ({ style: {}, attrs: {}, events: {}, motions: [], animate(frames, options) { this.motions.push({ frames, options }); return { cancel() {} }; }, addEventListener(type, callback) { this.events[type] = callback; }, setAttribute(name, value) { this.attrs[name] = value; }, focus() {} });
const viewport = element(), track = element(), indicator = element(), nav = element(), carousel = element();
const slides = [element(), element(), element()];
slides.forEach((slide, index) => { slide.getAttribute = () => '模块' + index; slide.querySelector = () => null; });
const buttons = slides.map((_, index) => ({ ...element(), offsetLeft: index * 24, offsetWidth: 24 }));
nav.querySelector = () => indicator; nav.querySelectorAll = () => buttons;
carousel.querySelector = (selector) => selector.includes('viewport') ? viewport : selector.includes('track') ? track : nav;
carousel.querySelectorAll = () => slides;
const sandbox = { Array, Number, Math, Date, homeCarouselTimer: 0,
  state: { homeCarouselIndex: 0, view: 'home', settings: {} },
  window: { matchMedia: () => ({ matches: false }), clearInterval() {}, setInterval: () => 1 },
  updatePixelRoom() {}, setupPixelRoomAnimation() {}, document: { hidden: false },
  getComputedStyle: (element) => ({ transform: element.style.transform || 'none', left: element.style.left || '0px' }),
};
vm.createContext(sandbox); vm.runInContext(code, sandbox);
sandbox.setupHomeCarousel({ querySelector: () => carousel });
assert.equal(indicator.style.left, '4px');
buttons[2].events.click();
assert.equal(track.style.transform, 'translate3d(-200%,0,0)');
assert.equal(track.motions.length, 1, 'Switching must create an actual animation, not just change the final style');
assert.equal(track.motions[0].options.easing, 'cubic-bezier(.25,1.2,.35,1)');
assert.equal(indicator.motions.length, 1);
assert.equal(indicator.style.left, '52px');
assert.equal(buttons[2].attrs['aria-pressed'], 'true');
assert.equal(slides[0].inert, true);
nav.events.keydown({ key: 'ArrowRight', preventDefault() {} });
assert.equal(sandbox.state.homeCarouselIndex, 0, 'Keyboard selection wraps to the first module');
sandbox.window.matchMedia = () => ({ matches: true });
buttons[1].events.click();
assert.equal(track.motions.length, 3, 'The user explicitly requested spring motion for this switch');
assert.equal(indicator.motions.length, 3);
assert.doesNotMatch(source, /pfh-home-carousel-slider/);
console.log('PASS: actual spring animations, carousel indicator and keyboard navigation');
