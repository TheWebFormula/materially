import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };

class MCProgressCircularElement extends HTMLComponentElement {
  static tag = 'mc-progress-circular';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #value = 0;
  #max = 1;
  #indeterminate = false;
  #activeTrack;
  #inactiveTrack;
  #percent = 0;
  #firstUpdate = true;


  constructor() {
    super();

    this.role = 'progressbar';
    this.render();
    this.#activeTrack = this.shadowRoot.querySelector('.active-track');
    this.#inactiveTrack = this.shadowRoot.querySelector('.inactive-track');
    if (!this.ariaLabel) this.ariaLabel = 'progress';
  }

  connectedCallback() {
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '1');
  }

  template() {
    return /*html*/`
      <svg viewBox="0 0 4800 4800">
        <circle class="inactive-track" pathLength="100"></circle>
        <circle class="active-track" pathLength="100"></circle>
      </svg>
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
      this.#activeTrack.style.strokeDashoffset = '';
      this.#inactiveTrack.style.strokeDashoffset = '';
      this.#inactiveTrack.style.transform = '';
    } else {
      // calculate animation duration for change in percent
      const newPercent = this.value / this.max;
      const diff = newPercent - this.#percent;
      this.#percent = newPercent;
      const circumference = 2 * Math.PI * (this.offsetWidth / 2);
      const circumferenceChange = Math.max(0, diff * circumference);
      const duration = this.#firstUpdate ? 0 : Math.min(Math.round(circumferenceChange * 14), 700);
      this.#firstUpdate = false;

      const dashOffset = (1 - newPercent) * 100;
      this.#activeTrack.style.strokeDashoffset = dashOffset;

      // Adjust percent to allow a gap between the active and inactive
      const adjustedPercent = Math.max(0, newPercent + 0.04);
      const dashOffsetInactive = adjustedPercent * 100;
      const rotateInactive = (newPercent + ((adjustedPercent - newPercent) / 2)) * 360;

      this.style.setProperty('--mc-progress-circular-transition-duration', `${duration}ms`);
      this.#inactiveTrack.style.strokeDashoffset = dashOffsetInactive;
      this.#inactiveTrack.style.transform = `rotate(${rotateInactive}deg)`;
      this.setAttribute('aria-valuenow', this.#value);
    }
  }
}
customElements.define(MCProgressCircularElement.tag, MCProgressCircularElement);
