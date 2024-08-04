import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from './../../helpers/util.js';

class MCAvatarElement extends HTMLComponentElement {
  static tag = 'mc-avatar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #checked = false;
  #onClick_bound = this.#onClick.bind(this);

  constructor() {
    super();

    this.render();
  }

  static get observedAttributesExtended() {
    return [
      ['checked', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString());
  }

  template() {
    return /* html */`
      <slot></slot>
      <svg version="1.1" focusable="false" viewBox="0 0 24 24">
        <path fill="none" stroke="white" stroke-width="2" d="M4.1,12.7 9,17.6 20.3,6.3" ></path>
      </svg>
    `;
  }

  connectedCallback() {
    if (this.hasAttribute('select')) {
      util.addClickTimeoutEvent(this, this.#onClick_bound);
      setTimeout(() => {
        this.classList.add('animation');
      }, 150);
    }
  }

  disconnectedCallback() {
    util.removeClickTimeoutEvent(this, this.#onClick_bound);
  }

  #onClick() {
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

customElements.define(MCAvatarElement.tag, MCAvatarElement);
