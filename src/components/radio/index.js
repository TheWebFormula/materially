import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';


let idCounter = 0;

class MCRadioElement extends HTMLComponentElement {
  static tag = 'mc-radio';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;


  #id;
  #abort;
  #internals;
  #input;
  #initiating = true;
  #name;
  #change_bound = this.#change.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);
  #updateValue_bound = this.#updateValue.bind(this);


  constructor() {
    super();
    
    this.#internals = this.attachInternals();
    this.role = 'radio';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.render();
    this.#input = this.shadowRoot.querySelector('input');
    this.#id = `mc-radio-${idCounter++}`;
    this.#input.id = this.#id;
    this.shadowRoot.querySelector('label').setAttribute('for', this.#id);
  }

  template() {
    return /*html*/`
      <div class="container">
        <div class="background"></div>
        <input type="radio" />
        <mc-state-layer ripple ripple-centered outer-circle style="border-radius: 50%"></mc-state-layer>
      </div>
      <label><slot></slot></label>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['checked', 'boolean'],
      ['value', 'string'],
      ['disabled', 'boolean'],
      ['name', 'string']
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
    this.addEventListener('change', this.#change_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    this.#updateValidity();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
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

  get name() { return this.#name }
  set name(value) {
    this.#name = value;
    this.#input.name = this.#name;
    this.#internals.setFormValue(this.checked ? this.value : null, this.checked ? 'checked' : undefined);
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
    this.#updateValidityDisplay();
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

  #slotChange() {
    if (!this.ariaLabel) this.ariaLabel = this.textContent;
    this.shadowRoot.querySelector('label').classList.toggle('has-label', !!this.textContent);
  }

  #updateValue() {
    this.setAttribute('aria-checked', this.#input.checked.toString());
    this.#internals.setFormValue(this.#input.checked ? this.value : null, this.#input.checked ? 'checked' : undefined);
    this.#updateValidity();
    this.#updateValidityDisplay();
    if (!this.#initiating) {
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  #change() {
    if (!this.checked) return;
    const checked = document.querySelectorAll(`mc-radio[name="${this.name}"][aria-checked=true]`);
    for (const radio of checked) {
      if (radio !== this) radio.checked = false;
    }
  }
}
customElements.define(MCRadioElement.tag, MCRadioElement);
