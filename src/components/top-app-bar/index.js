import HTMLComponentElement from '../HTMLComponentElement.js';
import util from '../../helpers/util.js';
import styles from './component.css' assert { type: 'css' };


class MCTopAppBarElement extends HTMLComponentElement {
  static tag = 'mc-top-app-bar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #scrollTop = 0;
  #position = 0;
  #height = 64;
  #compress = false;
  #medium = false;
  #large = false;
  #scrollContainer;
  #scrollTopContainer;
  #scrolling = false;
  #scrollInterval;
  #scrollEndTimer;
  #scroll_bound = util.rafThrottle(this.#scroll.bind(this));
  #scrollEnd_bound = this.#scrollEnd.bind(this);

  
  constructor() {
    super();

    this.#scrollTopContainer = document.querySelector('mc-pane[scroll]') || document.documentElement;
    this.#scrollContainer = document.querySelector('mc-pane[scroll]') || document;
    this.render();
  }

  template() {
    return /*html*/`
    <div class="container">
      <slot name="leading-icon"></slot>
      <slot name="headline"></slot>
      <slot name="trailing-icon"></slot>
    </div>
    <slot name="alt-headline"></slot>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['autohide', 'boolean'],
      ['compress', 'boolean'],
      ['medium', 'boolean'],
      ['large', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#scrollContainer.addEventListener('scroll', this.#scroll_bound);
    this.#scrollContainer.addEventListener('scrollend', this.#scrollEnd_bound);
    this.#scrollContainer.addEventListener('touchend', this.#scrollEnd_bound);
    if (this.#compress && this.#medium && !this.querySelector('[slot="alt-headline"]')) {
      let headline = this.querySelector('[slot="headline"]');
      let cloned = headline.cloneNode(true);
      cloned.setAttribute('slot', 'alt-headline');
      this.appendChild(cloned);
    }
    if (this.#compress && this.#large && !this.querySelector('[slot="alt-headline"]')) {
      let headline = this.querySelector('[slot="headline"]');
      let cloned = headline.cloneNode(true);
      cloned.setAttribute('slot', 'alt-headline');
      this.appendChild(cloned);
    }
  }

  disconnectedCallback() {
    this.#scrollContainer.removeEventListener('scroll', this.#scroll_bound);
    this.#scrollContainer.removeEventListener('scrollend', this.#scrollEnd_bound);
    this.#scrollContainer.removeEventListener('touchend', this.#scrollEnd_bound);
  }

  get autohide() { return this.compress }
  set autohide(value) {
    this.compress = !!value;
  }

  get compress() { return this.hasAttribute('compress'); }
  set compress(value) {
    this.#compress = !!value;
    this.toggleAttribute('compress', !!value);
  }

  get medium() { return this.hasAttribute('medium'); }
  set medium(value) {
    this.toggleAttribute('medium', !!value);
    this.#medium = !!value;
    this.#height = !!value ? 112 : 64;
  }

  get large() { return this.hasAttribute('large'); }
  set large(value) {
    this.toggleAttribute('large', !!value);
    this.#large = !!value;
    this.#height = !!value ? 152 : 64;
  }


  /*
   * Used to kickoff scroll interval and handle scroll end since there is no scrollend event on IOS
   * We are using an interval to compress the top app bar because the scroll events speed produces choppy movement
   */
  #scroll() {
    if (!this.#scrolling) {
      this.#scrolling = true;
      this.#runScroll();
    } else {
      if (this.#scrollEndTimer) clearTimeout(this.#scrollEndTimer);
      this.#scrollEndTimer = setTimeout(() => {
        if (this.#scrollInterval) {
          clearInterval(this.#scrollInterval);
          this.#scrollInterval = undefined;
        }

        this.#scrollEndTimer = undefined;
        this.#scrolling = false;
      }, 100);
    }
  }

  #scrollEnd() {
    this.#scrolling = false;
    clearInterval(this.#scrollInterval);
    this.#scrollInterval = undefined;
  }

  #runScroll() {
    if (this.#scrollInterval) clearInterval(this.#scrollInterval);
    this.#scrollInterval = setInterval(() => {
      if (this.#compress) {
        let isNormal = !this.#medium && !this.#large;
        const currentScrollTop = this.#scrollTopContainer.scrollTop;
        let distance = currentScrollTop - this.#scrollTop;
        this.#scrollTop = currentScrollTop;
        this.#position += distance;
        const minPosition = isNormal ? 64 : this.#height - 64;
        if (this.#position > minPosition) this.#position = minPosition;
        if (this.#position < 0) this.#position = 0;
        this.style.top = `-${this.#position}px`;
        if (!isNormal) this.style.paddingTop = `${this.#position}px`;
        this.classList.toggle('scrolled', currentScrollTop > minPosition && this.#position < this.#height);

        const start = Math.max(this.#position, 5);
        const percent = Math.max(0, 1 - ((start - 5) / (minPosition / 3)));
        if (!isNormal) this.style.setProperty('--mc-top-app-bar-alt-headline-opacity', percent);
      } else {
        this.classList.toggle('scrolled', this.#scrollTopContainer.scrollTop > 0);
      }
    }, 8); // 8 is twice every frame at 60 FPS. This produces smooth movement
  }
}

customElements.define(MCTopAppBarElement.tag, MCTopAppBarElement);
