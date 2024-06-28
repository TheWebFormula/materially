import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './segmented-button-set.css' assert { type: 'css' };


class MCSegmentedButtonSetElement extends HTMLComponentElement {
  static tag = 'mc-segmented-button-set';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #multiple = false;
  #checkIcon = false;
  #onclick_bound = this.#onclick.bind(this);

  constructor() {
    super();

    this.role = 'radiogroup';
    this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }

  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['multiple', 'boolean'],
      ['check-icon', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() { return [...this.querySelectorAll('mc-segmented-button.checked')].map(e => e.value).join(','); }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('mc-segmented-button')].forEach(item => {
      item.checked = valueArray.includes(item.value);
    });
  }

  get multiple() { return this.#multiple; }
  set multiple(value) { this.#multiple = !!value; }

  get checkIcon() { return this.#checkIcon; }
  set checkIcon(value) {
    this.#checkIcon = !!value;

    [...this.querySelectorAll('mc-segmented-button')].forEach(item => {
      item.classList.toggle('check-icon', !!value);
    });
  }

  connectedCallback() {
    this.addEventListener('click', this.#onclick_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onclick_bound);
  }

  deselect() {
    const currentSelected = this.querySelector('mc-segmented-button.checked');
    if (currentSelected) currentSelected.checked = false;
  }

  #onclick(event) {
    if (this.#multiple) {
      event.target.checked = !event.target.checked;
    } else {
      this.deselect();
      event.target.checked = true;
    }

    event.target.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
customElements.define(MCSegmentedButtonSetElement.tag, MCSegmentedButtonSetElement);
