import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';

let counter = 0;

class MCSwitchElement extends HTMLComponentElement {
  static tag = 'mc-switch';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;

  #internals;
  #input;
  #label;
  #abort;
  #checked = false;
  #initiating = true;
  #updateValue_bound = this.#updateValue.bind(this);

  
  constructor() {
    super();

    this.role = 'switch';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.#internals = this.attachInternals();
    this.render();
    this.#input = this.shadowRoot.querySelector('input');
  }

  template() {
    return /*html*/`
      <label></label>
      <div class="container">
        <input type="checkbox" role="switch">
        <div class="track">
          <div class="thumb-container">
            <div class="thumb">
              <div class="icon icon-checked">
                <svg viewBox="0 0 24 24">
                  <path d="M9.55 18.2 3.65 12.3 5.275 10.675 9.55 14.95 18.725 5.775 20.35 7.4Z" />
                </svg>
              </div>
              <div class="icon icon-unchecked">
                <svg viewBox="0 0 24 24">
                  <path d="M6.4 19.2 4.8 17.6 10.4 12 4.8 6.4 6.4 4.8 12 10.4 17.6 4.8 19.2 6.4 13.6 12 19.2 17.6 17.6 19.2 12 13.6Z" />
                </svg>
              </div>

            <mc-state-layer></mc-state-layer>
            </div>
          </div>
        </div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['label', 'string'],
      ['label-right', 'string'],
      ['checked', 'boolean'],
      ['disabled', 'boolean'],
      ['required', 'boolean'],
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#input.value = this.value;
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
    this.#input.required = this.required;
    this.#updateValue();

    this.#abort = new AbortController();
    this.#input.addEventListener('change', this.#updateValue_bound, { signal: this.#abort.signal });
    this.#updateValidity();
    this.#initiating = false;

    setTimeout(() => {
      this.shadowRoot.querySelector('.container').classList.add('animation');
    }, 150);
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

  get checked() { return this.#checked; }
  set checked(value) {
    this.#checked = !!value;
    this.#input.checked = this.#checked;
    this.#updateValue();
  }

  get label() { return this.#label; }
  set label(value) {
    const label = this.shadowRoot.querySelector('label');
    if (!this.#input.hasAttribute('id')) {
      const id = `mcswitch-${counter++}`;
      this.#input.setAttribute('id', id);
      label.setAttribute('for', id);
    }

    this.#label = value;
    label.innerText = this.#label || '';
    this.ariaLabel = value;
    label.classList.toggle('show', !!value);
    label.classList.remove('right');
  }

  get labelRight() { return this.#label; }
  set labelRight(value) {
    const label = this.shadowRoot.querySelector('label');
    if (!this.#input.hasAttribute('id')) {
      const id = `mcswitch-${counter++}`;
      this.#input.setAttribute('id', id);
      label.setAttribute('for', id);
    }

    this.#label = value;
    label.innerText = this.#label || '';
    this.ariaLabel = value;
    label.classList.toggle('show', !!value);
    label.classList.toggle('right', !!value);
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
    this.#checked = this.#input.checked;
    this.setAttribute('aria-checked', this.#checked.toString());
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    this.#updateValidity();
    this.#updateValidityDisplay();
    if (!this.#initiating) this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
customElements.define(MCSwitchElement.tag, MCSwitchElement);
