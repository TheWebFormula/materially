import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';

let counter = 0;

class MCCheckboxElement extends HTMLComponentElement {
  static tag = 'mc-checkbox';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;

  #internals;
  #input;
  #abort;
  #label;
  #initiating = true;
  #updateValue_bound = this.#updateValue.bind(this);


  constructor() {
    super();

    this.role = 'checkbox';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.#internals = this.attachInternals();
    this.render();
    this.#input = this.shadowRoot.querySelector('input');
  }

  template() {
    return /*html*/`
      <div class="container">
        <input type="checkbox">
        <div class="outline"></div>
        <div class="background"></div>
        <mc-state-layer ripple ripple-centered outer-circle></mc-state-layer>
        <svg class="icon" viewBox="0 0 18 18" aria-hidden="true">
          <rect class="mark short" />
          <rect class="mark long" />
        </svg>
      </div>
      <label></label>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['label', 'string'],
      ['label-left', 'string'],
      ['checked', 'boolean'],
      ['indeterminate', 'boolean'],
      ['disabled', 'boolean'],
      ['required', 'boolean'],
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.#input.addEventListener('change', this.#updateValue_bound, { signal: this.#abort.signal });
    this.#updateValidity();
    this.#initiating = false;
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    this.#initiating = true;
  }

  get value() { return this.#input.value; }
  set value(value) {
    this.#input.value = value;
    this.#updateValue();
  }

  get checked() { return this.#input.checked; }
  set checked(value) {
    const checked = !!value;
    this.#input.checked = checked;
    this.#updateValue();
  }

  get indeterminate() { return this.#input.indeterminate; }
  set indeterminate(value) {
    this.#input.indeterminate = value;
  }

  get label() { return this.#label; }
  set label(value) {
    const label = this.shadowRoot.querySelector('label');
    if (!this.#input.hasAttribute('id')) {
      const id = `mccheckbox-${counter++}`;
      this.#input.setAttribute('id', id);
      label.setAttribute('for', id);
    }
    this.#label = value;
    label.innerText = this.#label || '';
    this.ariaLabel = value;
    label.classList.toggle('show', !!value);
    label.classList.remove('right');
  }

  get labelLeft() { return this.#label; }
  set labelLeft(value) {
    const label = this.shadowRoot.querySelector('label');
    if (!this.#input.hasAttribute('id')) {
      const id = `mccheckbox-${counter++}`;
      this.#input.setAttribute('id', id);
      label.setAttribute('for', id);
    }

    this.#label = value;
    label.innerText = this.#label || '';
    this.ariaLabel = value;
    label.classList.toggle('show', !!value);
    label.classList.toggle('left', !!value);
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    this.toggleAttribute('required', !!value);
    this.#input.toggleAttribute('required', !!value);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    this.toggleAttribute('disabled', value);
    this.#input.toggleAttribute('disabled', value);
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }


  formStateRestoreCallback(state) {
    this.#input.value = state;
  }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    this.#updateValidityDisplay();
    return this.#internals.checkValidity();
  }
  setCustomValidity(value = '') {
    this.#input.setCustomValidity(value);
  }

  formResetCallback() {
    this.checked = this.hasAttribute('checked');
    this.#input.classList.remove('touched');
  }

  #updateValidityDisplay() {
    this.#input.classList.add('touched');
  }

  #updateValidity() {
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage || '', this.#input);
  }

  #updateValue() {
    this.setAttribute('aria-checked', this.#input.checked.toString());
    this.#internals.setFormValue(this.#input.checked ? this.value : null, this.#input.checked ? 'checked' : undefined);
    this.#updateValidity();
    this.#updateValidityDisplay();
    if (!this.#initiating) this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
customElements.define(MCCheckboxElement.tag, MCCheckboxElement);
