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
  #percent = 0;
  #firstUpdate = true;


  constructor() {
    super();

    this.role = 'progressbar';
    this.render();
    this.#activeBar = this.shadowRoot.querySelector('.active-bar');
    this.#inactiveBar = this.shadowRoot.querySelector('.inactive-bar');
    if (!this.ariaLabel) this.ariaLabel = 'progress';
  }

  connectedCallback() {
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '1');
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
    this.setAttribute('aria-valuemax', this.#max);
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
      // calculate animation duration for change in percent
      const newPercent = this.value / this.max;
      const diff = newPercent - this.#percent;
      this.#percent = newPercent;
      const widthChange = Math.max(0, diff * this.offsetWidth);
      const duration = this.#firstUpdate ? 0 : Math.min(Math.round(widthChange * 4), 700);
      this.#firstUpdate = false;

      this.style.setProperty('--mc-progress-linear-transition-duration', `${duration}ms`);
      this.#activeBar.style.transform = `scaleX(${newPercent})`;
      this.#inactiveBar.style.left = `${newPercent * 100}%`;
      this.setAttribute('aria-valuenow', this.#value);
    }
  }
}
customElements.define(MCProgressLinearElement.tag, MCProgressLinearElement);
