import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './search-option-group.css' assert { type: 'css' };


class MCSearchOptionGroupElement extends HTMLComponentElement {
  static tag = 'mc-search-option-group';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #label;
  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.render();
  }


  template() {
    return /*html*/`
      <div class="label"></div>
      <slot></slot>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['label', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get label() { return this.#label; }
  set label(value) {
    this.#label = value;
    this.shadowRoot.querySelector('.label').innerText = value;
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
  }

  #slotChange(event) {
    this.shadowRoot.querySelector('.label').classList.toggle('has-results', event.target.assignedElements().length > 0);
  }
}
customElements.define(MCSearchOptionGroupElement.tag, MCSearchOptionGroupElement);
