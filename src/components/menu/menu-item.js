import HTMLComponentElement from "../HTMLComponentElement.js";
import styles from './menu-item.css' assert { type: 'css' };
import '../state-layer/index.js';


export default class MCMenuItemElement extends HTMLComponentElement {
  static tag = 'mc-menu-item';
  static useShadowRoot = true;
  static shadowRootDelegateFocus = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #nesting = false;


  constructor() {
    super();

    this.role = 'button';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.render();
  }

  template() {
    return /*html*/`
      <button>
        <slot name="start"></slot>
        <slot class="default-slot"></slot>
        <slot name="end"></slot>
        <mc-state-layer ripple noring></mc-state-layer>
      </button>
    `;
  }

  get nesting() { return this.#nesting; }
  set nesting(value) {
    this.#nesting = !!value;

    let arrow = this.querySelector('.drop-arrow');
    if (this.#nesting) {
      if (arrow) return;
      this.insertAdjacentHTML('beforeend', `
        <svg height="4" viewBox="7 10 10 5" focusable="false" class="drop-arrow">
          <polygon
            class="down"
            stroke="none"
            fill-rule="evenodd"
            points="7 10 12 15 17 10"></polygon>
        </svg>
      `);
    } else if (arrow) {
      arrow.remove();
    }
  }
}
customElements.define(MCMenuItemElement.tag, MCMenuItemElement);
