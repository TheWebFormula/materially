import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './carousel-item.css' assert { type: 'css' };


export default class MCCarouselItemElement extends HTMLComponentElement {
  static tag = 'mc-carousel-item';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #width = null;


  constructor() {
    super();
    this.render();
  }

  template() {
    return /*html*/`
      <div class="text">
        <slot name="title"></slot>
      </div>
      <slot></slot>
    `;
  }

  connectedCallback() {
    if (!this.width) {
      const img = this.querySelector('img');
      if (img) {
        const width = img.getAttribute('width');
        if (width) this.width = width;
        else if (img.complete) this.width = img.offsetWidth;
        else {
          img.onload = () => {
            this.width = img.offsetWidth;
          };
        }
      } else this.width = this.offsetWidth;
    }
    if (this.querySelector('[slot=title]')) this.classList.add('has-text');
  }

  static get observedAttributes() {
    return ['width'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get width() {
    return this.#width;
  }

  set width(value) {
    value = parseInt(value);
    const changed = value !== this.#width;
    this.#width = value;
    if (changed) this.dispatchEvent(new Event('mccarouselitemchange', { bubbles: true }));
  }
}

customElements.define(MCCarouselItemElement.tag, MCCarouselItemElement);
