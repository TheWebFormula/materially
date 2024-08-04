import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';


class MCSliderElement extends HTMLComponentElement {
  static tag = 'mc-slider';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;


  #id;
  #abort;
  #internals;
  #inputStart;
  #inputEnd;
  #valueLabelStart;
  #valueLabelEnd;
  #value;
  #valueStart;
  #valueEnd;
  #range = false;

  #slotChange_bound = this.#slotChange.bind(this);
  #onInputStart_bound = this.#onInputStart.bind(this);
  #onInputEnd_bound = this.#onInputEnd.bind(this);


  constructor() {
    super();

    this.#internals = this.attachInternals();
    // this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.render();
    this.#inputStart = this.shadowRoot.querySelector('input.start');
    this.#inputStart.min = 0;
    this.#inputStart.max = 100;
    this.#inputEnd = this.shadowRoot.querySelector('input.end');
    this.#inputEnd.min = 0;
    this.#inputEnd.max = 100;
    this.#valueLabelStart = this.shadowRoot.querySelector('.handle.start .value');
    this.#valueLabelEnd = this.shadowRoot.querySelector('.handle.end .value');
  }

  template() {
    return /*html*/`
      <slot name="leading-icon"></slot>
      <div class="container">
        <slot class="label"></slot>
        <input class="start" type="range">
        <input class="end" type="range">

        <div class="track"></div>
        <div class="tick-marks"></div>

        <div class="handle-padding">
          <div class="handle start">
            <div class="value-container">
              <div class="value"></div>
            </div>
          </div>

          <div class="handle end">
            <div class="value-container">
              <div class="value"></div>
            </div>
          </div>
        </div>
        
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['name', 'string'],
      ['value', 'number'],
      ['value-start', 'number'],
      ['value-end', 'number'],
      ['range', 'boolean'],
      ['max', 'number'],
      ['min', 'number'],
      ['step', 'number']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  connectedCallback() {
    this.#abort = new AbortController();
    this.#inputStart.addEventListener('input', this.#onInputStart_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });

    if (this.#range) {
      const rangeValueQuarter = (this.max - this.min) * 0.25;
      if (this.#valueStart === undefined) this.#valueStart = rangeValueQuarter;
      if (this.#valueEnd === undefined) this.#valueEnd = rangeValueQuarter * 3;
      this.valueStart = this.valueStart;
      this.valueEnd = this.valueEnd;
      this.#inputEnd.addEventListener('input', this.#onInputEnd_bound, { signal: this.#abort.signal });
    } else {
      if (!this.#range) {
        this.#value = this.#inputStart.value;
        this.#updateValue();
      } else {
        this.#valueStart = this.#inputStart.value;
      }
    }
    this.#updateValidity();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }




  get value() { return this.#value; }
  set value(value) {
    if (this.#range) return;

    this.#value = value;
    this.#updateValue();
  }

  #updateValue() {
    this.#inputStart.value = this.#value;
    this.#internals.setFormValue(this.#inputStart.value);
    this.#valueLabelStart.innerHTML = this.#value;
    let percent = parseInt(((this.#value - this.min) / (this.max - this.min)) * 100);
    if (percent <= 0) percent = 0;
    else if (percent >= 100) percent = 100;
    this.shadowRoot.querySelector('.container').style.setProperty('--mc-slider-active-end', `${percent}%`);
  }

  get valueStart() { return this.#valueStart; }
  set valueStart(value) {
    this.#updateStartValue(value);
  }

  #updateStartValue(value) {
    value = parseFloat(value);

    if (value >= this.valueEnd) value = this.#valueEnd;
    this.#valueStart = value;
    this.#inputStart.value = value;
    const data = new FormData();
    data.append(this.nameStart, String(this.valueStart));
    data.append(this.nameEnd, String(this.valueEnd));
    this.#internals.setFormValue(data);
    this.#valueLabelStart.innerHTML = this.#valueStart;

    let percent = ((this.#valueStart - this.min) / (this.max - this.min)) * 100;
    if (percent <= 0) percent = 0;
    else if (percent >= 100) percent = 100;
    this.shadowRoot.querySelector('.container').style.setProperty('--mc-slider-active-start', `${percent}%`);

    this.#updateRangeDisplay();
  }

  get valueEnd() { return this.#valueEnd; }
  set valueEnd(value) {
    this.#updateEndValue(value);
  }

  #updateEndValue(value) {
    value = parseFloat(value);

    if (value <= this.valueStart) value = this.#valueStart;
    this.#valueEnd = value;
    this.#inputEnd.value = value;
    const data = new FormData();
    data.append(this.nameStart, String(this.valueStart));
    data.append(this.nameEnd, String(this.valueEnd));
    this.#internals.setFormValue(data);
    this.#valueLabelEnd.innerHTML = this.#valueEnd;

    let percent = parseInt(((this.#valueEnd - this.min) / (this.max - this.min)) * 100);
    if (percent <= 0) percent = 0;
    else if (percent >= 100) percent = 100;
    this.shadowRoot.querySelector('.container').style.setProperty('--mc-slider-active-end', `${percent}%`);

    this.#updateRangeDisplay(true);
  }

  get nameStart() { return this.#inputStart.name; }
  get nameEnd() { return this.#inputEnd.name; }

  get name() { return this.getAttribute('name'); }
  set name(value) {
    this.setAttribute('name', value);
    if (this.#range) {
      this.#inputStart.name = `${value}-start`;
      this.#inputEnd.name = `${value}-end`;
    } else {
      this.#inputStart.name = value;
    }
  }

  get range() { return this.#range; }
  set range(value) {
    this.#range = value;
  }

  get max() { return this.range ? this.#inputEnd.max : this.#inputStart.max; }
  set max(value) {
    this.#inputStart.max = value;
    if (this.#range) this.#inputEnd.max = value;
  }

  get min() { return this.#inputStart.min; }
  set min(value) {
    this.#inputStart.min = value;
    if (this.#range) this.#inputEnd.min = value;
  }

  get step() { return this.#inputStart.step; }
  set step(value) {
    this.#inputStart.step = value;
    if (this.#range) this.#inputEnd.step = value;
    const stepCount = (this.max - this.min) / value;
    this.shadowRoot.querySelector('.container').classList.toggle('step', !!value);
    this.shadowRoot.querySelector('.container').style.setProperty('--mc-slider-tick-mark-count', stepCount);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    this.toggleAttribute('disabled', value);
    this.#inputStart.toggleAttribute('disabled', value);
    if (this.#inputEnd) this.#inputEnd.toggleAttribute('disabled', value);
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }


  reset() {
    if (this.#range) {
      this.value = this.getAttribute('value') ?? '';
    } else {
      this.valueStart = this.getAttribute('value-start') ?? '';
      this.valueEnd = this.getAttribute('value-end') ?? '';
    }
  }
  formResetCallback() { this.reset(); }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    return this.checkValidity();
  }

  // formResetCallback() {
  //   this.checked = this.hasAttribute('checked');
  //   this.#input.classList.remove('touched');
  // }


  #onInputStart() {
    let change = false;

    if (!this.#range) {
      change = this.#value !== this.#inputStart.value;
      this.#value = this.#inputStart.value;
      this.#updateValue();
    } else {
      change = this.#valueStart !== this.#inputStart.value;
      this.#updateStartValue(this.#inputStart.value);
    }

    this.#updateValidity();
    if (change) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onInputEnd() {
    let change = this.#valueEnd !== this.#inputEnd.value;
    this.#updateEndValue(this.#inputEnd.value);
    this.#updateValidity();
    if (change) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #updateValidity() {
    if (this.#range) {
      this.#internals.setValidity(this.#inputStart.validity, this.#inputStart.validationMessage || '');
    } else {
      if (this.#inputStart.validity.valid === false) this.#internals.setValidity(this.#inputStart.validity, this.#inputStart.validationMessage || '');
      else if (this.#inputEnd.validity.valid === false) this.#internals.setValidity(this.#inputEnd.validity, this.#inputEnd.validationMessage || '');
      else this.#internals.setValidity(this.#inputStart.validity, this.#inputStart.validationMessage || '');
    }
  }


  #slotChange(event) {
    if (event.target.classList.contains('label')) {
      const label = [...event.target.assignedNodes()].map(e => e.data).join('').trim();
      this.shadowRoot.querySelector('slot[name="leading-icon"]').classList.toggle('has-label', !!label);
      if (!this.ariaLabel) this.ariaLabel = label;
    }
  }

  #updateRangeDisplay(isEnd = false) {
    const diff = ((this.#valueEnd - this.#valueStart) / (this.max - this.min)) / 2 * 100;
    this.shadowRoot.querySelector('.container').style.setProperty('--mc-slider-range-active-diff', `${diff}%`);

    const handleStart = this.shadowRoot.querySelector('.handle.start');
    const handleEnd = this.shadowRoot.querySelector('.handle.end');
    handleStart.classList.remove('overlap');
    handleEnd.classList.remove('overlap');
    if (handleStart.getBoundingClientRect().right > handleEnd.getBoundingClientRect().left) {
      if (isEnd) handleEnd.classList.add('overlap');
      else handleStart.classList.add('overlap');
    }
  }
}
customElements.define(MCSliderElement.tag, MCSliderElement);
