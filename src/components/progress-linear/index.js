import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };


class MCProgressLinearElement extends HTMLComponentElement {
  static tag = 'mc-progress-linear';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #value = 0;
  #max = 1;
  #indeterminate = false;
  #activeBar;
  #inactiveBar;


  constructor() {
    super();

    this.role = 'progressbar';
    this.render();
    this.#activeBar = this.shadowRoot.querySelector('.active-bar');
    this.#inactiveBar = this.shadowRoot.querySelector('.inactive-bar');
    if (!this.ariaLabel) this.ariaLabel = 'progress';
  }

  template() {
    return /*html*/`
      <div class="dots"></div>
      <div class="inactive-bar">
        <div class="stop"></div>
      </div>
      <div class="active-bar">
        <div class="inner-bar"></div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['value', 'number'],
      ['max', 'number'],
      ['indeterminate', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get max() { return this.#max; }
  set max(value) {
    this.#max = parseFloat(value);
    if (this.#value > this.#max) this.#value = this.#max;
    this.#updateProgress();
  }

  get value() { return this.#value; }
  set value(value) {
    this.#value = parseFloat(value);
    if (this.#value < 0) this.#value = 0;
    if (this.#value > this.#max) this.#value = this.#max;
    this.#updateProgress();
  }

  get indeterminate() { return this.#indeterminate; }
  set indeterminate(value) {
    this.#indeterminate = !!value;
    this.toggleAttribute('indeterminate', !!value);
  }

  #updateProgress() {
    if (this.indeterminate) {
      this.#activeBar.style.transform = '';
      this.#inactiveBar.style.left = '';
    } else {
      const percent = this.value / this.max;
      this.#activeBar.style.transform = `scaleX(${percent})`;
      this.#inactiveBar.style.left = `${percent * 100}%`;
    }
  }
}
customElements.define(MCProgressLinearElement.tag, MCProgressLinearElement);
