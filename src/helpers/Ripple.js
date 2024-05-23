export default class Ripple {
  #rippleFaceInDuration = 280;
  #rippleFadeOutDuration = 150;
  #states = {
    FADING_IN: 'FADING_IN',
    VISIBLE: 'VISIBLE',
    FADING_OUT: 'FADING_OUT',
    HIDDEN: 'HIDDEN'
  };

  #element;
  #triggerElement;
  #ignoreElements = [];
  #centered = false;
  #color;
  #persistent = false;
  #radius;
  #speedFactor = 1;
  #activeRipples = new Set();
  #isMousedown = false;
  #mouseDown_bound = this.#mouseDown.bind(this);
  #fadeOutAllRipples_bound = this.#fadeOutAllRipples.bind(this);
  #mouseLeave_bound = this.#mouseLeave.bind(this);


  constructor(params = {
    element,
    triggerElement,
    ignoreElements: [],
    centered: false,
    color: null,
    persistent: false,
    radius,
    speedFactor: 1
  }) {
    if (!params.element) throw Error('requires params.element');
    if (!params.triggerElement) throw Error('requires params.triggerElement');

    this.#element = params.element;
    this.#triggerElement = [].concat(params.triggerElement);
    this.#ignoreElements = [].concat(params.ignoreElements).filter(v => !!v);
    this.#centered = params.centered !== undefined ? params.centered : this.#centered;
    this.#color = params.color;
    this.#persistent = params.persistent !== undefined ? params.persistent : this.#persistent;
    this.#radius = params.radius;
    this.#speedFactor = params.speedFactor !== undefined ? params.speedFactor : this.#speedFactor;

    this.#triggerElement.forEach(element => {
      element.addEventListener('pointerdown', this.#mouseDown_bound);
    });
  }


  destroy() {
    this.#triggerElement.forEach(element => {
      element.removeEventListener('pointerdown', this.#mouseDown_bound);
      element.removeEventListener('pointerup', this.#fadeOutAllRipples_bound);
      element.removeEventListener('mouseleave', this.#mouseLeave_bound);
    });
  }

  addIgnoreElement(element) {
    this.#ignoreElements.push(element);
  }

  trigger() {
    const originalCenter = this.#centered;
    this.#centered = true;
    this.#fadeInRipple();
    this.#centered = originalCenter;
  }

  #mouseDown(event) {
    if (this.#ignoreElements.find(v => v.contains(event.target))) return;
    this.#isMousedown = true;
    this.#triggerElement.forEach(element => {
      element.addEventListener('pointerup', this.#fadeOutAllRipples_bound);
      element.addEventListener('mouseleave', this.#mouseLeave_bound);
    });
    this.#fadeInRipple(event.pageX, event.pageY);
  }

  #mouseLeave() {
    if (this.#isMousedown) this.#fadeOutAllRipples();
  }

  #fadeOutAllRipples() {
    this.#isMousedown = false;
    // Fade-out all ripples that are completely visible and not persistent.
    this.#activeRipples.forEach(ripple => {
      if (!ripple.persistent && ripple.state === this.#states.VISIBLE) ripple.fadeOut();
    });
    this.#triggerElement.forEach(element => {
      element.removeEventListener('pointerup', this.#fadeOutAllRipples_bound);
      element.removeEventListener('mouseleave', this.#mouseLeave_bound);
    });
  }

  #fadeInRipple(pageX, pageY) {
    const containerRect = this.#element.getBoundingClientRect();

    if (this.#centered) {
      pageX = containerRect.left + containerRect.width / 2;
      pageY = containerRect.top + containerRect.height / 2;
    } else {
      // Subtract scroll values from the coordinates because calculations below
      // are always relative to the viewport rectangle.
      const scrollPosition = this.#getViewportScrollPosition();
      pageX -= scrollPosition.left;
      pageY -= scrollPosition.top;
    }

    const duration = this.#rippleFaceInDuration * (1 / this.#speedFactor);
    const offsetX = pageX - containerRect.left;
    const offsetY = pageY - containerRect.top;
    const radius = this.#radius || this.#distanceToFurthestCorner(pageX, pageY, containerRect);
    const ripple = this.#createRippleElement(offsetX, offsetY, radius, duration);
    this.#element.appendChild(ripple);

    const reference = {
      element: ripple,
      persistent: this.#persistent,
      state: this.#states.FADING_IN,
      fadeOut: () => this.#fadeOutRipple(reference)
    };
    this.#activeRipples.add(reference);
    setTimeout(() => {
      ripple.style.transform = 'scale(1)';

      setTimeout(() => {
        reference.state = this.#states.VISIBLE;
        if (!this.#persistent && !this.#isMousedown) reference.fadeOut();
      }, duration);
    }, 1);
  }

  #fadeOutRipple(reference) {
    if (!this.#activeRipples.delete(reference)) return;

    const ripple = reference.element;
    ripple.style.transitionDuration = `${this.#rippleFadeOutDuration}ms`;
    ripple.style.opacity = '0';
    reference.state = this.#states.FADING_OUT;

    setTimeout(() => {
      reference.state = this.#states.HIDDEN;
      ripple.remove();
    }, this.#rippleFadeOutDuration);
  }
  
  #getViewportScrollPosition() {
    const documentRect = document.documentElement.getBoundingClientRect();

    // The top-left-corner of the viewport is determined by the scroll position of the document
    // body, normally just (scrollLeft, scrollTop). However, Chrome and Firefox disagree about
    // whether `document.body` or `document.documentElement` is the scrolled element, so reading
    // `scrollTop` and `scrollLeft` is inconsistent. However, using the bounding rect of
    // `document.documentElement` works consistently, where the `top` and `left` values will
    // equal negative the scroll position.
    const top = -documentRect.top || document.body.scrollTop || window.scrollY || document.documentElement.scrollTop || 0;
    const left = -documentRect.left || document.body.scrollLeft || window.scrollX || document.documentElement.scrollLeft || 0;

    return { top, left };
  }

  #distanceToFurthestCorner(x, y, rect) {
    const distX = Math.max(Math.abs(x - rect.left), Math.abs(x - rect.right));
    const distY = Math.max(Math.abs(y - rect.top), Math.abs(y - rect.bottom));
    return Math.sqrt(distX * distX + distY * distY);
  }

  #createRippleElement(offsetX, offsetY, radius, duration) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple-element');
    ripple.style.opacity = '0.16';
    ripple.style.left = `${offsetX - radius}px`;
    ripple.style.top = `${offsetY - radius}px`;
    ripple.style.height = `${radius * 2}px`;
    ripple.style.width = `${radius * 2}px`;
    ripple.style.position = 'absolute';
    ripple.style.pointerEvents = 'none';
    ripple.style.borderRadius = '50%';
    ripple.style.transition = 'opacity, transform 0ms cubic-bezier(0, 0, 0.2, 1)';
    ripple.style.transform = 'scale(0)';

    // If the color is not set, the default CSS color will be used.
    ripple.style.backgroundColor = this.#color;
    ripple.style.transitionDuration = `${duration}ms`;

    return ripple;
  }
}
