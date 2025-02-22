import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';
import { error_FILL1_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';
import formatter from './formatter.js';


const isIncrementalSupported = 'incremental' in document.createElement('input');
const inputElement = document.createElement('input');
inputElement.setAttribute('placeholder', ' ');
inputElement.classList.add('input');
const textareaElement = document.createElement('textarea');
textareaElement.setAttribute('placeholder', ' ');
textareaElement.classList.add('input');



class MCTextfieldElement extends HTMLComponentElement {
  static tag = 'mc-textfield';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;

  #abort;
  #internals;
  #input;
  #characterCount;
  #errorText = '';
  #formatter;
  #incremental = false;
  #label = '';
  #rows = 1;
  #value = null;
  #suggestion;
  #hasSuggestion;
  #supportingText = '';
  #type;
  #invalidIcon;
  #touched = false;
  #focusValue;
  #slotChange_bound = this.#slotChange.bind(this);
  #dispatchSearch_bound = this.#dispatchSearch.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #incrementalPolyfill_debounced = util.debounce(this.#dispatchSearch, 300).bind(this);
  #onSelect_bound = this.#onSelect.bind(this);
  #onFocus_bound = this.#onFocus.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #onKeydown_bound = this.#onKeydown.bind(this);


  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.render();


    const type = this.getAttribute('type');
    const beforeElement = this.shadowRoot.querySelector('.prefix-text');
    if (type === 'textarea') beforeElement.insertAdjacentElement('afterend', textareaElement.cloneNode());
    else {
      const el = inputElement.cloneNode();
      el.type = this.getAttribute('type');
      beforeElement.insertAdjacentElement('afterend', el);
    }
    this.#input = this.shadowRoot.querySelector('.input');
  }

  template() {
    return /*html*/`
      <div class="text-field">
        <slot name="leading-icon"></slot>
        <div class="prefix-text"></div>

        <label class="no-animation"></label>

        <div class="outlined-border-container">
          <div class="outlined-leading"></div>
          <div class="outlined-notch no-animation" label=""></div>
          <div class="outlined-trailing"></div>
        </div>

        <div class="suggestion"></div>
        <span class="suffix-text"></span>
        <slot name="trailing-icon"></slot>
        <div class="supporting-text"></div>
        <div class="character-count"></div>
        <slot name="picker"></slot>

        <div class="resizer"></div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['autocomplete', 'string'],
      ['character-count', 'boolean'],
      ['disabled', 'boolean'],
      ['error-text', 'string'],
      ['format', 'string'],
      ['incremental', 'boolean'],
      ['label', 'string'],
      ['mask', 'string'],
      ['max', 'string'],
      ['maxlength', 'number'],
      ['min', 'string'],
      ['minlength', 'number'],
      ['multiple', 'boolean'],
      ['pattern-restrict', 'boolean'],
      ['pattern', 'string'],
      ['placeholder', 'string'],
      ['prefix-text', 'string'],
      ['readonly', 'boolean'],
      ['required', 'boolean'],
      ['rows', 'number'],
      ['step', 'number'],
      ['suffix-text', 'string'],
      ['suggestion', 'string'],
      ['supporting-text', 'string'],
      ['type', 'string'],
      ['inputmode', 'string'],
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();

    this.#input.value = this.value;
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage, this.#input);

    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    if (this.type === 'search') this.#input.addEventListener('search', this.#dispatchSearch_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('select', this.#onSelect_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#onFocus_bound, { signal: this.#abort.signal });

    this.#updateCharacterCount();
    if (this.hasAttribute('format')) {
      this.#formatter = new formatter(this);
      this.#formatter.onInput = this.#onFormatterInput.bind(this);
    }

    setTimeout(() => {
      this.shadowRoot.querySelector('label').classList.remove('no-animation');
      this.shadowRoot.querySelector('.outlined-notch').classList.remove('no-animation');
    }, 200);

  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#formatter) {
      this.#formatter.destroy();
      this.#formatter = undefined;
    }
  }


  get label() { return this.#label || (this.getAttribute('label') || ''); }
  set label(value) {
    this.#label = value;
    this.shadowRoot.querySelector('.text-field').classList.toggle('label', !!this.#label);
    this.shadowRoot.querySelector('label').textContent = this.#label;
    if (this.hasAttribute('outlined')) {
      this.shadowRoot.querySelector('.outlined-notch').textContent = this.#label;
      this.shadowRoot.querySelector('.outlined-notch').setAttribute('label', this.#label);
    }
    if (!this.ariaLabel) this.ariaLabel = this.#label;
  }

  get ariaLabel() { return this.#input.ariaLabel }
  set ariaLabel(value) {
    this.#input.ariaLabel = value;
  }

  get autocomplete() { return this.getAttribute('autocomplete'); }
  set autocomplete(value) {
    if (value) this.setAttribute('autocomplete', value);
    else this.removeAttribute('autocomplete');
  }

  get characterCount() { return this.#characterCount; }
  set characterCount(value) {
    this.#characterCount = !!value;
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    this.toggleAttribute('disabled', value);
    if (value) this.blur();
    this.#input.toggleAttribute('disabled', value);
  }

  get errorText() { return this.#errorText; }
  set errorText(value) {
    this.#errorText = value || '';
    if (!this.checkValidity()) {
      const el = this.shadowRoot.querySelector('.text-field .supporting-text');
      el.textContent = this.#errorText;
      el.setAttribute('title', this.#errorText)
    }
  }

  get form() { return this.#internals.form; }

  get format() { return this.getAttribute('format'); }
  set format(value) {
    // if (this.#formatter) this.#formatter.format = value;
    this.setAttribute('format', value);
  }

  get formattedValue() { return this.#formatter ? this.#formatter.formattedValue : this.value; }

  get incremental() { return this.#incremental; }
  set incremental(value) {
    this.#incremental = value;
    this.#input.incremental = this.#incremental;
  }

  get mask() { return this.getAttribute('mask'); }
  set mask(value) {
    // if (this.#formatter) this.#formatter.mask = value;
    this.setAttribute('mask', value);
  }

  get maskedValue() { return this.#formatter ? this.#formatter.maskedValue : this.value; }

  get max() { return this.getAttribute('max'); }
  set max(value) {
    this.setAttribute('max', value);
    this.#input.setAttribute('max', value);
  }

  get maxlength() { return this.getAttribute('maxlength'); }
  set maxlength(value) {
    this.setAttribute('maxlength', value);
    this.#input.setAttribute('maxlength', value);
  }

  get min() { return this.getAttribute('min'); }
  set min(value) {
    this.setAttribute('min', value);
    this.#input.setAttribute('min', value);
  }

  get minlength() { return this.getAttribute('minlength'); }
  set minlength(value) {
    this.setAttribute('minlength', value);
    this.#input.setAttribute('minlength', value);
  }

  get multiple() { return this.hasAttribute('multiple'); }
  set multiple(value) {
    this.toggleAttribute('multiple', value);
    this.#input.toggleAttribute('multiple', value);
  }

  get patternRestrict() { return this.hasAttribute('pattern-restrict'); }
  set patternRestrict(value) {
    // if (this.#formatter) this.#formatter.patternRestrict = value;
    this.toggleAttribute('pattern', value);
  }

  get pattern() { return this.getAttribute('pattern'); }
  set pattern(value) {
    // if (this.#formatter) {
    //   if (value) {
    //     this.#formatter.pattern = value;
    //   } else this.#formatter.disable();
    // }
    // if (this.#formatter && !value) this.#formatter.disable();
    this.setAttribute('pattern', value);
    this.#input.setAttribute('pattern', value);
  }

  get placeholder() { return this.getAttribute('placeholder'); }
  set placeholder(value) {
    if (value) this.setAttribute('placeholder', value);
    else this.removeAttribute('placeholder');
    this.#input.setAttribute('placeholder', value || ' ');
  }

  get prefixText() { return this.getAttribute('prefix-text'); }
  set prefixText(value) {
    this.setAttribute('prefix-text', value);
    this.shadowRoot.querySelector('.prefix-text').textContent = value || '';
  }

  get readonly() { return this.hasAttribute('readonly'); }
  set readonly(value) {
    this.toggleAttribute('readonly', value);
    if (value) this.blur();
    this.#input.toggleAttribute('readonly', value);
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    this.toggleAttribute('required', value);
    this.#input.toggleAttribute('required', value);
  }

  get rows() { return this.#rows; }
  set rows(value) {
    this.#rows = value;
    if (this.getAttribute('type') === 'textarea') this.#input.setAttribute('rows', value || 1);
  }

  get selectionDirection() { return this.#input?.selectionDirection || 0; }
  set selectionDirection(value = 0) {
    this.#input.selectionDirection = value;
  }

  get selectionEnd() { return this.#input?.selectionEnd || 0; }
  set selectionEnd(value = 0) {
    this.#input.selectionEnd = value;
  }

  get selectionStart() { return this.#input?.selectionStart || 0; }
  set selectionStart(value = 0) {
    this.#input.selectionStart = value;
  }

  get step() { return this.getAttribute('step'); }
  set step(value) {
    this.setAttribute('step', value);
    this.#input.setAttribute('step', value);
  }

  get suffixText() { return this.getAttribute('suffix-text'); }
  set suffixText(value) {
    this.setAttribute('suffix-text', value);
    this.shadowRoot.querySelector('.suffix-text').textContent = value || '';
  }

  get suggestion() { return this.#suggestion; }
  set suggestion(value) {
    this.#suggestion = value;
    this.#setSuggestion();
  }

  get supportingText() { return this.#supportingText; }
  set supportingText(value) {
    this.#supportingText = value || '';
    if (!this.#errorText || this.checkValidity()) {
      const el = this.shadowRoot.querySelector('.text-field .supporting-text');
      el.textContent = this.#supportingText;
      el.setAttribute('title', this.#supportingText)
    }
  }

  get type() { return this.getAttribute('type'); }
  set type(value) {
    this.#type = value;
    this.setAttribute('type', value);
    this.#input.setAttribute('type', value);
    if (this.type === 'search' && this.#abort) this.#input.addEventListener('search', this.#dispatchSearch_bound, { signal: this.#abort.signal });
  }

  get inputmode() { return this.getAttribute('inputmode'); }
  set inputmode(value) {
    this.setAttribute('inputmode', value);
    this.#input.setAttribute('inputmode', value);
  }

  get value() {
    if (this.#formatter) return this.#formatter.value;
    return this.#value;
  }
  set value(value) {
    this.#input.value = value;
    this.#value = this.#input.value;
    this.#internals.setFormValue(this.#value);
    this.classList.toggle('has-value', !!this.#value);
    this.#updateCharacterCount();
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }

  get popoverTargetElement() {
    return this.#input.popoverTargetElement
  }
  set popoverTargetElement(value) {
    this.#input.popoverTargetElement = value;
  }


  clear() {
    const change = this.value !== '';
    this.value = '';
    if (this.type === 'search' && change) this.dispatchEvent(new Event('search'));
  }

  reset() {
    this.#touched = false;
    this.value = this.getAttribute('value') ?? '';
    this.#updateValidity();
    this.#updateValidityDisplay(true);
  }
  formResetCallback() { this.reset(); }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    this.#updateValidityDisplay();
    return this.checkValidity();
    // calling this will show browser native popover
    // return this.#internals.reportValidity();
  }
  updateValidity() {
    this.#updateValidity();
  }
  setCustomValidity(value = '') {
    this.#input.setCustomValidity(value);
    this.#updateValidityDisplay();
  }

  select() { this.#input.select(); }
  setRangeText(replacement, start, end, selectMode) {
    this.#input.setRangeText(replacement, start, end, selectMode);
  }
  setSelectionRange(selectionStart, selectionEnd, selectionDirection) {
    this.#input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  }


  #updateValidity() {
    this.#touched = true;
    this.#internals.setFormValue(this.#input.value);
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage, this.#input);
  }

  #updateValidityDisplay(valid = this.#input.checkValidity()) {
    this.classList.toggle('invalid', !valid);

    if (!valid) {
      if (!this.#invalidIcon) {
        this.#invalidIcon = document.createElement('div');
        this.#invalidIcon.classList.add('invalid-icon');
        this.#invalidIcon.innerHTML = error_FILL1_wght400_GRAD0_opsz24;
      }

      this.shadowRoot.querySelector('.text-field').appendChild(this.#invalidIcon);
    } else if (this.#invalidIcon) {
      this.#invalidIcon.remove();
    }

    this.#setSupportingText(valid);
  }

  #setSupportingText(valid = this.checkValidity()) {
    const supportingTextElement = this.shadowRoot.querySelector('.text-field .supporting-text');
    const value = valid ? this.#supportingText : this.#errorText || this.#input.validationMessage;
    supportingTextElement.textContent = value;
    supportingTextElement.setAttribute('title', value)
  }

  #setSuggestion() {
    if (typeof this.#suggestion !== 'string') return;
    const suggestionElement = this.shadowRoot.querySelector('.text-field .suggestion');

    const match = this.#suggestion.match(new RegExp(`^${this.#input.value}(.*)`, 'i'));
    const value = !match || match[0] === match[1] ? '' : match[1];
    this.#hasSuggestion = !!value;
    suggestionElement.textContent = value;

    // groups style recalculations together and reduces render time
    queueMicrotask(() => {
      const offset = util.getTextWidthFromInput(this.#input);
      suggestionElement.style.left = `${offset + 16}px`;
    });
  }
  
  #updateCharacterCount() {
    if (!this.#characterCount) return;

    const count = (this.#value || '').length;
    const display = !!this.maxlength ? `${count}/${this.maxlength}` : `${!count ? '' : count}`;
    this.shadowRoot.querySelector('.character-count').textContent = display;
  }

  #updateTextareaHeight() {
    this.#input.style.height = 'auto';
    let height = this.#input.scrollHeight;
    if (height <= 40) height -= 28;
    this.#input.style.height = `${height}px`;
    if (this.#input.offsetHeight < this.#input.scrollHeight) this.#input.style.height = `${this.#input.offsetHeight - 16}px`;
  }

  #slotChange(event) {
    if (event.target.name === 'leading-icon') {
      const hasLeadingIcon = event.target.assignedElements({ flatten: true }).length > 0;
      this.shadowRoot.querySelector('.text-field').classList.toggle('leading-icon', hasLeadingIcon);
    }

    if (event.target.name === 'trailing-icon') {
      const hasTrailingIcon = event.target.assignedElements({ flatten: true }).length > 0;
      this.shadowRoot.querySelector('.text-field').classList.toggle('trailing-icon', hasTrailingIcon);
    }

    if (event.target.name === 'picker') {
      if ([...event.target.assignedElements()].find(e => e.nodeName === 'MC-TIME-PICKER' || e.nodeName === 'MC-DATE-PICKER' || e.nodeName === 'MC-DATE-RANGE-PICKER')) {
        this.shadowRoot.querySelector('.text-field').classList.add('has-picker')
      }
    }
  }

  #dispatchSearch() {
    this.dispatchEvent(new Event('search', {
      bubbles: true,
      composed: true
    }));
  }

  #onInput() {
    this.#value = this.#input.value;
    this.#setSuggestion();
    this.#updateValidity();
    this.#updateCharacterCount();
    if (this.type === 'textarea') this.#updateTextareaHeight();
    // only update display if invalid while in focus
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();

    // polyfill incremental search events
    if (this.#type === 'search' && this.#incremental && !isIncrementalSupported) this.#incrementalPolyfill_debounced();
  }

  #onSelect() {
    this.dispatchEvent(new Event('select', { bubbles: true }));
  }

  #onFocus() {
    if (this.readonly) return;
    this.#focusValue = this.value;

    if (this.popoverTargetElement instanceof HTMLElement) {
      this.popoverTargetElement.showPopover();
    }

    this.addEventListener('blur', this.#onBlur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
  }

  #onBlur() {
    if (this.readonly) return;

    this.removeEventListener('blur', this.#onBlur_bound);
    this.removeEventListener('keydown', this.#onKeydown_bound);

    // do not update if no text was changed
    if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
    }
    // this.#dirty = false;
    if (this.value !== this.#focusValue) this.dispatchEvent(new Event('change', { bubbles: true }));
    this.classList.toggle('has-value', !!this.value);
  }

  #onKeydown(event) {
    const tab = event.code === 'Tab';
    if (this.#hasSuggestion && tab) {
      this.value = this.#suggestion;
      this.#setSuggestion();
      event.preventDefault();
    }
  }

  #onFormatterInput() {
    this.#updateValidity();
    // only update display if invalid while in focus
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
customElements.define(MCTextfieldElement.tag, MCTextfieldElement);
