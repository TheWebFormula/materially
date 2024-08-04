import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';


// TODO variables.css

class MCBadgeElement extends HTMLComponentElement {
  static tag = 'mc-badge';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #value = '0';
  #displayValue = '';
  #parentType;
  #ariaLabelOriginal;

  constructor() {
    super();

    this.render();
    this.value = this.innerText;
    this.ariaHidden = true;
  }

  template() {
    return /*html*/`<slot></slot>`;
  }

  static get observedAttributesExtended() {
    return [
      ['value', 'number']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    if (this.parentElement.nodeName === 'MC-BUTTON') this.classList.add('in-mc-button');
    else if (this.parentElement.nodeName === 'A') this.classList.add('in-anchor');
  }

  get value() { return this.#value; }
  set value(value) {
    this.#value = value;

    const num = parseInt(value);
    if (isNaN(num) || num <= 0) this.#displayValue = '';
    else if (num > 999) this.#displayValue = '999+';
    else this.#displayValue = `${num}`;

    this.classList.toggle('has-value', !!this.#displayValue);
    super.innerText = this.#displayValue;

    if (!this.#parentType) this.#parentType = this.parentElement.nodeName.toLowerCase();
    if (!this.#ariaLabelOriginal) {
      if (this.#parentType === 'mc-icon-button') this.#ariaLabelOriginal = this.parentElement.querySelector('mc-icon').innerText;
      else if (this.#parentType === 'a') this.#ariaLabelOriginal = this.parentElement.href;
      else this.#ariaLabelOriginal = this.parentElement.ariaLabel || util.getTextFromNode(this.parentElement);
    }

    if (!value || value === '0') this.parentElement.ariaLabel = this.#ariaLabelOriginal;
    else {
      if (this.hasAttribute('hide-value')) {
        this.parentElement.ariaLabel = `[${this.#ariaLabelOriginal}] New notification`;
      } else this.parentElement.ariaLabel = `[${this.#ariaLabelOriginal}] ${this.#displayValue} New ${parseInt(value) === 1 ? 'notification' : 'notifications'}`;
    }
  }

  get innerHTML() { return super.innerHTML; }
  set innerHTML(value) { this.value = value; }

  get innerText() { return super.innerText; }
  set innerText(value) { this.value = value; }
}
customElements.define(MCBadgeElement.tag, MCBadgeElement);
