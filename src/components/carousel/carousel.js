import HTMLComponentElement from '../HTMLComponentElement.js';
import util from '../../helpers/util.js';
import styles from './carousel.css';
import Swipe from '../../helpers/Swipe.js';


export default class MCCarouselElement extends HTMLComponentElement {
  static tag = 'mc-carousel';
  static styleSheets = [styles];

  #swipe;
  #abort;
  #strategy = 'multi-browse';
  #strategies = ['multi-browser', 'hero-start', 'hero-center'];
  #itemScrollPositions = [];
  #snapPositions;
  #hasDragged = false;
  #hasCalculated = false;
  #initiated = false;
  #startX;
  #cancelMomentum = false;

  #calculateLayout_debounce = util.debounce(this.#calculateLayout.bind(this), 0);
  #calculateLayout_bound = util.rafThrottle(this.#calculateLayout.bind(this));
  #swipeStart_bound = this.#swipeStart.bind(this);
  #swipeEnd_bound = this.#swipeEnd.bind(this);
  #swipeMove_bound = this.#swipeMove.bind(this);

  #scrolling = false;
  #scrollInterval;
  #scrollEndTimer;


  constructor() {
    super();
  }

  connectedCallback() {
    this.insertAdjacentHTML('afterbegin', '<div class="carousel-front-padding"></div>');
    this.insertAdjacentHTML('beforeend', '<div class="carousel-back-padding"></div>');

    this.#abort = new AbortController();
    this.addEventListener('mccarouselitemchange', this.#calculateLayout_debounce, { signal: this.#abort.signal });
    this.addEventListener('scroll', this.#calculateLayout_bound, { signal: this.#abort.signal });

    this.#swipe = new Swipe(this, { horizontalOnly: true, includeMouse: true, preventClick: true });
    this.#swipe.enable();
    this.addEventListener('swipestart', this.#swipeStart_bound, { signal: this.#abort.signal });
    this.addEventListener('swipemove', this.#swipeMove_bound, { signal: this.#abort.signal });
    this.addEventListener('swipeend', this.#swipeEnd_bound, { signal: this.#abort.signal });

    this.#initiated = true;
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#swipe) this.#swipe.destroy();
  }

  static get observedAttributes() {
    return ['strategy'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get strategy() {
    return this.#strategy;
  }

  set strategy(value) {
    if (!this.#strategies.includes(value)) throw Error(`Invalid strategy. Use (${this.#strategies})`);
    this.#strategy = value;
    if (this.#initiated) this.#calculateLayout();
  }

  scrollToItem(index, animation = true) {
    this.scrollTo({ left: this.#itemScrollPositions[index], behavior: animation ? 'smooth' : 'instant' });
  }

  #calculateLayout() {
    switch (this.#strategy) {
      case 'multi-browse':
        this.#calculateLayoutRunner({
          minWidth: 40,
          maxWidth: this.offsetWidth - 40 + 8,
          useOpacity: true,
          snapOffset: 0
        });
        break;
      case 'hero-start':
        this.#calculateLayoutRunner({
          minWidth: 56,
          maxWidth: this.offsetWidth - 56 + 8,
          useOpacity: false,
          snapOffset: 0
        });
        break;
      case 'hero-center':
        this.#calculateLayoutRunner({
          minWidth: 56,
          maxWidth: this.offsetWidth - ((56 + 8) * 2),
          useOpacity: false,
          snapOffset: 56 + 8
        });
        if (!this.#hasDragged) this.scrollToItem(Math.floor(this.querySelectorAll('mc-carousel-item').length / 2), false);
        break;
    }

    if (!this.#hasCalculated) {
      this.#hasCalculated = true;
      this.classList.add('loaded');
    }
  }

  #calculateLayoutRunner({
    minWidth,
    maxWidth,
    useOpacity,
    snapOffset
  }) {
    const gap = 8;
    const minWidthGap = minWidth + gap;
    const opacityWidth = (minWidth * 2) - gap;
    const displayWidth = this.offsetWidth;
    const scrollLeft = this.scrollLeft;
    const scrollSnapPositions = [];
    const bounds = this.getBoundingClientRect();
    const itemElements = [...this.querySelectorAll('mc-carousel-item')];

    let totalWidth = 0;
    let totalAdjustedWidth = 0;
    let scrollLeftPadding = 0;
    let pastFirstItem = false;
    let leftOverSpace;

    for (const [index, itemElement] of itemElements.entries()) {
      const itemBounds = itemElement.getBoundingClientRect();
      const itemWidth = Math.max(minWidth, Math.min(maxWidth, itemElement.width || 0));
      const itemWidthAndGap = itemWidth + gap;
      this.#itemScrollPositions[index] = index === 0 ? 0 : totalWidth - snapOffset;
      scrollSnapPositions.push(index === 0 ? 0 : totalWidth - snapOffset);
      totalWidth += itemWidthAndGap;
      const itemScrollDistance = Math.max(0, totalWidth - scrollLeft);
      const isFirstItem = itemScrollDistance > 0 && itemScrollDistance <= itemWidthAndGap;
      const isVisible = itemBounds.left < bounds.right;
      const lastItem = index === itemElements.length - 1;
      let adjustWidth = minWidth;
      let opacity = 0;
      let textOpacity = 0;

      if (isFirstItem) {
        pastFirstItem = true;
        leftOverSpace = displayWidth - itemScrollDistance;
        const adjustPercent = Math.max(0, itemScrollDistance - minWidth) / (itemWidthAndGap - minWidth);
        adjustWidth = Math.min(itemWidth, ((itemWidth - minWidth) * adjustPercent) + minWidth);
        scrollLeftPadding += itemWidth - adjustWidth;
        if (useOpacity) opacity = (opacityWidth - Math.max(0, scrollLeft - totalWidth + opacityWidth)) / opacityWidth;
        textOpacity = (opacityWidth - Math.max(0, scrollLeft - totalWidth + opacityWidth + (itemWidth / 3))) / opacityWidth;

      } else if (!pastFirstItem) { // before first
        scrollLeftPadding += itemWidth - minWidth;

      } else if (isVisible && lastItem) { // last item is visible
        adjustWidth = Math.min(itemWidth, Math.max(minWidth, leftOverSpace));
        if (useOpacity) opacity = Math.min(1, (bounds.right - itemBounds.left) / opacityWidth);
        textOpacity = Math.min(1, (bounds.right - itemBounds.left - (minWidth / 2)) / opacityWidth);

      } else if (isVisible) { // visible
        const tamperWidth = this.offsetWidth - minWidthGap - minWidth;
        const left = Math.max(0, itemBounds.left - bounds.left - minWidthGap);
        const tamperPercent = (left / tamperWidth);
        const temperOffset = Math.ceil(tamperPercent * (itemWidth / 2));
        adjustWidth = Math.min(leftOverSpace, itemWidth - temperOffset);
        leftOverSpace -= (adjustWidth + gap);

        if (useOpacity) opacity = Math.min(1, (bounds.right - itemBounds.left) / opacityWidth);
        textOpacity = Math.min(1, (bounds.right - itemBounds.left - (minWidth / 2)) / opacityWidth);
      }

      totalAdjustedWidth += adjustWidth + gap;
      itemElement.style.flexBasis = `${adjustWidth}px`;
      itemElement.style.width = `${adjustWidth}px`;
      if (useOpacity) itemElement.style.opacity = opacity;
      itemElement.style.setProperty('--mc-carousel-item-text-opacity', textOpacity);
    }

    this.#snapPositions = scrollSnapPositions;
    this.querySelector('.carousel-front-padding').style.width = `${scrollLeftPadding}px`;
    this.querySelector('.carousel-back-padding').style.width = `${totalWidth - (totalAdjustedWidth + scrollLeftPadding)}px`;
  }




  #swipeStart() {
    this.#hasDragged = true;
    this.#startX = this.scrollLeft;
    this.#cancelMomentum = true;
  }

  #swipeMove(event) {
    this.scrollLeft = this.#startX - event.distanceX;
  }

  #swipeEnd(event) {
    this.#cancelMomentum = false;
    let elapsed = 16.7;
    let delta;
    let target = this.scrollLeft;
    let deltas = [];
    let deltaTotal = 0;
    const shouldScroll = event.velocity > 10 || event.velocity < -10;

    if (shouldScroll) {
      // Simulate animation at 60 FPS to estimate target position and deltas
      const amplitude = (0.12 * event.velocity) * event.directionX;
      do {
        delta = Math.round(-amplitude * Math.exp(-elapsed / 325));
        deltaTotal += delta;
        deltas.push(delta);
        target = Math.round(target + delta);
        elapsed += 16.7;
      } while (delta > 0.5 || delta < -0.5);
    }
    
    // get closest  snap position based on direction
    let closest = this.#snapPositions.reduce((prev, curr) => {
      return (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
    });

    const diff = closest - this.scrollLeft;

    if (!shouldScroll) {
      // create linear movement to settle to closest target;
      const move = 4 * event.directionX;
      const length = Math.round(diff / move);
      for (let i = 0; i < length; i += 1) {
        deltas.push(move);
      }
    } else {
      // adjust deltas to include closest target
      deltas = deltas.map((v, i) => {
        return Math.round((v / deltaTotal) * diff);
      });
    }

    requestAnimationFrame(() => this.#momentumMove(deltas.reverse()));
  }

  #momentumMove(deltas) {
    if (deltas.length === 0 || this.#cancelMomentum) return;
    const delta = deltas.pop();
    this.scrollLeft += delta;
    this.#calculateLayout();
    requestAnimationFrame(() => this.#momentumMove(deltas));
  }
}

customElements.define(MCCarouselElement.tag, MCCarouselElement);
