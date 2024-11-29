import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list.css' assert { type: 'css' };


class MCListElement extends HTMLComponentElement {
  static tag = 'mc-list';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #onChange_bound = this.#onChange.bind(this);


  constructor() {
    super();

    this.role = 'list';
    this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }
  
  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['reorder', 'boolean'],
      ['swap', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() {
    return [...this.querySelectorAll('mc-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'))
      .join(',');
  }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('mc-list-item')]
      .forEach(item => item.selected = valueArray.includes(item.value));
  }

  get swap() { return this.hasAttribute('swap'); }
  set swap(value) {
    setTimeout(() => {
      [...this.querySelectorAll('mc-list-item')].map((element, i) => {
        element.swap = value;
      });
    });
  }

  connectedCallback() {
    // this.addEventListener('change', this.#onChange_bound);
  }

  disconnectedCallback() {
    // this.removeEventListener('change', this.#onChange_bound);
  }


  #onChange(event) {
    // if (!this.#multiple && event.target.selected) {
    //   [...this.querySelectorAll('mc-list-item')].forEach(e => {
    //     if (e === event.target) return;
    //     if (e.selected) e.selected = false;
    //   });
    // }
    // if (event.detail !== 'longpress' || this.#isSelectionMode) {
    //   if (this.values.length === 0) this.exitSelectionMode();
    //   return;
    // }
    // this.#isSelectionMode = true;
    // [...this.querySelectorAll('mc-list-item')].forEach(e => e.selectionMode = true);
    // this.dispatchEvent(new Event('enter-selection-mode', { bubbles: true }));
  }
}
customElements.define(MCListElement.tag, MCListElement);
