import HTMLComponentElement from '../HTMLComponentElement.js';
import util from '../../helpers/util.js';


export default class MCCarouselElement extends HTMLComponentElement {
  static tag = 'mc-carousel';

  #abort;
  #strategy = 'multi-browse';
  #strategies = ['multi-browser', 'hero-start', 'hero-center'];
  #itemScrollPositions = [];
  #snapPositions;
  #hasDragged = false;
  #hasCalculated = false;
  #initiated = false;
  #startTime;
  #lastTime;
  #lastX;
  #velocity;
  #pointerDown = false;
  #overflowTimeConstant = 325;

  #calculateLayout_debounce = util.debounce(this.#calculateLayout.bind(this), 0);
  #calculateLayout_bound = this.#calculateLayout.bind(this);
  #dragStart_bound = this.#dragStart.bind(this);
  #dragEnd_bound = this.#dragEnd.bind(this);
  #dragMove_bound = this.#dragMove.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    this.insertAdjacentHTML('afterbegin', '<div class="carousel-front-padding"></div>');
    this.insertAdjacentHTML('beforeend', '<div class="carousel-back-padding"></div>');

    this.#abort = new AbortController();
    this.addEventListener('mccarouselitemchange', this.#calculateLayout_debounce, { signal: this.#abort.signal });
    this.addEventListener('scroll', this.#calculateLayout_bound, { signal: this.#abort.signal });
    this.addEventListener('pointerdown', this.#dragStart_bound, { signal: this.#abort.signal });

    this.#initiated = true;
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
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


  #dragStart(event) {
    this.#hasDragged = true;
    this.#pointerDown = true;
    this.#startTime = Date.now();
    this.#lastTime = this.#startTime;
    this.#lastX = this.#getPositionX(event);
    this.#velocity = 0;
    window.addEventListener('pointerup', this.#dragEnd_bound, { signal: this.#abort.signal });
    window.addEventListener('pointermove', this.#dragMove_bound, { signal: this.#abort.signal });
  }

  #dragMove(event) {
    let currentX = this.#getPositionX(event);
    const deltaX = currentX - this.#lastX;
    this.#lastX = currentX;

    let currentTime = Date.now();
    let elapsedTime = currentTime - this.#lastTime;
    this.#lastTime = currentTime;
    this.#velocity = 0.8 * (10 * deltaX / (1 + elapsedTime)) + 0.2 * this.#velocity;
    let max = this.scrollWidth - this.offsetWidth;
    let position = Math.max(0, Math.min(max, this.scrollLeft - deltaX));
    this.scrollLeft = position;
  }

  #dragEnd() {
    window.removeEventListener('pointerup', this.#dragEnd_bound);
    window.removeEventListener('pointermove', this.#dragMove_bound);

    this.#pointerDown = false;
    if (this.#velocity === 0) return;

    const movements = this.#calculateMovements(this.#velocity > 0 ? -1 : 1);
    this.#runOverScroll(movements);
  }

  #runOverScroll(movements) {
    if (movements.length === 0 || this.#pointerDown === true) return;

    this.scrollLeft += movements.pop();
    requestAnimationFrame(() => this.#runOverScroll(movements));
  }

  #calculateMovements(direction) {
    let target = Math.round(this.scrollLeft + this.#velocity);
    let elapsed = 17;
    let count = 0;
    let deltaX;
    let adjustedDeltas = [];

    // Simulate animation at 60 FPS to estimate target position, to get iteration count
    do {
      deltaX = -this.#velocity * Math.exp(-elapsed / this.#overflowTimeConstant);
      target = Math.round(target + deltaX);
      elapsed += 17;
      count++;
    } while (deltaX > 0.5 || deltaX < -0.5);

    // get closest  snap position based on direction
    let closest = this.#snapPositions.reduce((prev, curr) => {
      return (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
    });

    if (direction === 1 && closest <= this.scrollLeft) {
      const closestIndex = this.#snapPositions.find(v => v === closest);
      const next = this.#snapPositions[closestIndex + 1];
      if (next) closest = next;
    } else if (direction === -1 && closest >= this.scrollLeft) {
      const closestIndex = this.#snapPositions.find(v => v === closest);
      const next = this.#snapPositions[closestIndex - 1];
      if (next) closest = next;
    }
    
    let closestDistance = closest - this.scrollLeft;

    // Prevent snapping when velocity is low
    let averageMovement = Math.abs(closestDistance / count);
    if (averageMovement > 5) count = Math.abs(Math.round(closestDistance / 5));
    
    // Build array of movements based on estimated run
    for (let i = 0; i < count; i++) {
      const adjusted = Math.round(closestDistance * ((i + 1) / count));
      closestDistance -= adjusted
      adjustedDeltas.push(adjusted);
    }

    // make sure larger numbers are first so we can pop
    adjustedDeltas.reverse();
    return adjustedDeltas;
  }

  #getPositionX(event) {
    return event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].clientX : event.clientX;
  }
}

customElements.define(MCCarouselElement.tag, MCCarouselElement);
