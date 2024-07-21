import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './tab.css' assert { type: 'css' };
import '../state-layer/index.js';

class MCTabElement extends HTMLComponentElement {
  static tag = 'mc-tab';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];

  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.role = 'tab';
    this.render();
  }

  template() {
    return /*html*/`
      <mc-state-layer ripple></mc-state-layer>
      <div class="container">
        <slot name="icon"></slot>
        <slot class="default-slot"></slot>
      </div>
    `;
  }

  get internalPosition() {
    return this.shadowRoot.querySelector('.container').getBoundingClientRect();;
  }

  get panel() {
    return document.querySelector(`#${this.getAttribute('aria-controls')}`);
  }


  connectedCallback() {
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
    this.panel.hidden = !this.classList.contains('active');
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
  }


  #slotChange(event) {
    if (event.target.getAttribute('name') === 'icon' && event.target.assignedElements().length > 0) {
      this.shadowRoot.querySelector('.container').classList.add('has-icon');
    }
  }
}
customElements.define(MCTabElement.tag, MCTabElement);
