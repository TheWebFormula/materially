import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';

let counter = 0;


/**
 * mc-checkbox form control
 * [documentation](https://materially.dev/checkboxes)
 *
 * Example:
 * ```html
 * <mc-checkbox checked label="Label"></mc-checkbox>
 * ```
 *
 * @tag mc-checkbox
 * @reference Materially - https://materially.dev/checkboxes
 *
 * @attr {string} [value="one"] - Added to formData when checked = true
 * @attr {boolean} [checked=false] - Checkbox checked state
 * @attr {boolean} [indeterminate=false] - Indeterminate state
 * @attr {string} label - Label value that displays next to checkbox
 * @attr {string} label-left - Label value that displays to th left of the checkbox
 * @attr {boolean} [disabled=false] - Disabled state
 * @attr {boolean} [required=false] - Required state
 *
 * @prop {string} validationMessage - read-only property that returns a string representation of validation constraints
 * @prop {ValidityState} validity - read-only returns validity state object
 * @prop {boolean} willValidate - read-only property that indicates if it is candidate for constraint validation
 *
 * @fires {Event} change - fires change when checked or indeterminate change
 *
 * @cssprop [--mc-checkbox-background-color=--mc-primary] - Checkbox background color
 * @cssprop [--mc-checkbox-background-disabled-color=--mc-on-surface] - Checkbox background color when disabled
 * @cssprop [--mc-checkbox-icon-color=--mc-on-primary] - Checkbox icon (checkmark) color
 * @cssprop [--mc-checkbox-icon-disabled-color=--mc-surface] - Checkbox icon (checkmark) color when disabled
 * @cssprop [--mc-checkbox-outline-color=--mc-on-surface-variant] - Checkbox outline color
 * @cssprop [--mc-checkbox-outline-disabled-color=--mc-on-surface] - Checkbox outline color when disabled
 * @cssprop [--mc-checkbox-label-disabled-color=--mc-on-surface] - Checkbox label color when disabled
 */
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
  #value = 'on';
  #checked = false;
  #initiating = true;
  #touched = false;
  #updateValue_bound = this.#updateValue.bind(this);
  #onClick_bound = this.#onClick.bind(this);


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
      ['aria-label', 'string'],
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
    this.#input.value = this.value;
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
    this.#input.indeterminate = this.indeterminate;
    this.#input.required = this.required;
    this.#updateValue();

    this.#abort = new AbortController();
    this.#input.addEventListener('change', this.#updateValue_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('click', this.#onClick_bound, { signal: this.#abort.signal });
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

  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    this.#input.value = value;
    this.#updateValue();
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.#input.checked = this.#checked;
    this.#updateValue();
  }

  get indeterminate() { return this.#input.indeterminate; }
  set indeterminate(value) {
    this.#input.indeterminate = value;
  }

  get ariaLabel() { return this.#input.ariaLabel; }
  set ariaLabel(value) {
    this.#input.ariaLabel = value;
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
    label.textContent = this.#label || '';
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
    label.textContent = this.#label || '';
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
    this.#touched = false;
    this.#updateValidityDisplay(true);
    this.checked = this.hasAttribute('checked');
    this.#input.classList.remove('touched');
  }

  #updateValidityDisplay(valid = this.#input.checkValidity()) {
    this.#input.classList.add('touched', valid);
  }

  #updateValidity() {
    this.#touched = true;
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage || '', this.#input);
  }

  #updateValue(event) {
    this.#checked = this.#input.checked;
    this.classList.toggle('checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString());
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
    }
    if (!this.#initiating && !!event) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onClick() {
    this.#touched = true;
  }
}
customElements.define(MCCheckboxElement.tag, MCCheckboxElement);
