import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';
import dialog from '../dialog/service.js';

const targetValues = ['_blank', '_parent', '_self', '_top'];

export default class MCButtonElement extends HTMLComponentElement {
  static tag = 'mc-button';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;



  #internals;
  #abort;
  #target = 'test';
  #href;
  #type;
  #button;
  #formState;
  #onclickValue;
  #async = false;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #asyncMouseup_bound = this.pending.bind(this);
  #formClick_bound = this.#formClick.bind(this);
  #formFocusIn_bound = this.#formFocusIn.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #formMouseDown_bound = this.#formMouseDown.bind(this);
  #formMouseUp_bound = this.#formMouseUp.bind(this);
  #hrefClick_bound = this.#hrefClick.bind(this);

  
  constructor() {
    super();


    this.role = 'button';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.#internals = this.attachInternals();
    this.render();
    this.#button = this.shadowRoot.querySelector('button');
  }

  template() {
    return /*html*/`
      <button>
        <slot name="leading-icon"></slot>
        <slot class="default-slot"></slot>
      </button>
      <div class="spinner"></div>
      <mc-state-layer ripple preventfocusnodename="MC-MENU-ITEM"></mc-state-layer>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['href', 'string'],
      ['target', 'string'],
      ['async', 'boolean'],
      ['disabled', 'boolean'],
      ['type', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();

    if (this.#async) this.addEventListener('mouseup', this.#asyncMouseup_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });

    if (this.form) {
      this.addEventListener('click', this.#formClick_bound, { signal: this.#abort.signal });
      this.addEventListener('mousedown', this.#formMouseDown_bound, { signal: this.#abort.signal });
      this.addEventListener('mouseup', this.#formMouseUp_bound, { signal: this.#abort.signal });
      this.form.addEventListener('focusin', this.#formFocusIn_bound, { signal: this.#abort.signal });
    }
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    this.#onclickValue = undefined;
    this.removeEventListener('click', this.#hrefClick_bound);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    this.toggleAttribute('disabled', !!value);
    this.#button.toggleAttribute('disabled', !!value);
  }

  get href() { return this.#href; }
  set href(value) {
    this.#href = value;
    if (!value) {
      this.removeAttribute('href');
      this.removeEventListener('click', this.#hrefClick_bound);
    } else {
      this.setAttribute('href', value);
      this.addEventListener('click', this.#hrefClick_bound);
    }
  }

  get target() { return this.#target; }
  set target(value) {
    if (value && !targetValues.includes(value)) throw Error(`Invalid target value. Valid values ${targetValues.join(', ')}`);
    this.#target = value;
  }

  get type() { return this.#button.getAttribute('type'); }
  set type(value) {
    this.#button.setAttribute('type', value);
  }

  get form() {
    return this.#internals.form;
  }

  get async() { return this.#async }
  set async(value) {
    this.#async = !!value;
  }

  pending() {
    this.classList.add('async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = `
      <mc-progress-circular style="width: 20px; height: 20px;" indeterminate class="${this.hasAttribute('filled') ? ' on-filled' : ''}${this.hasAttribute('filled-tonal') ? ' on-filled-tonal' : ''}"></mc-progress-circular>
    `;
  }

  resolve() {
    this.classList.remove('async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = '';
  }


  #focus() {
    this.addEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.removeEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #focusKeydown(e) {
    if (e.key === 'Enter' || e.keyCode === 32) this.shadowRoot.querySelector('mc-state-layer').triggerRipple();
  }

  // prevent onclick attribute from firing when form invalid
  #formMouseDown() {
    if (this.type === 'cancel' && this.onclick && this.#formState !== undefined && this.#getFormState() !== this.#formState) {
      this.#onclickValue = this.onclick;
      this.onclick = undefined;
    }
  }

  #formMouseUp() {
    if (this.type === 'cancel' && this.#onclickValue) {
      setTimeout(() => {
        this.onclick = this.#onclickValue;
        this.#onclickValue = undefined;
      });
    }
  }

  async #formClick(event) {
    const type = this.type || this.#button.type;
    switch (type) {
      case 'reset':
        this.form.reset();
        break;

      case 'submit':
        const shouldValidate = !this.form.hasAttribute('novalidate') && !this.hasAttribute('formnovalidate') && !this.form.checkValidity();
        if (shouldValidate) {
          const formElements = [...this.form.elements].filter(e => e.checkValidity);

          formElements.forEach(element => element.reportValidity());
          const firstInvalid = formElements.find(e => !e.checkValidity());
          const bounds = firstInvalid.getBoundingClientRect();
          if (!(bounds.y >= 0 && (bounds.y + bounds.height) <= window.innerHeight)) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          firstInvalid.focus({ preventScroll: true });
        } else {
          this.#formRequestSubmit();
        }
        break;

      case 'cancel':
        if (this.#formState !== undefined && this.#getFormState() !== this.#formState) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          dialog.simple({
            message: 'Discard changes?',
            actionConfirm: true,
            actionConfirmLabel: 'Cancel',
            actionCancel: true,
            actionCancelLabel: 'Discard'
          }).then(action => {
            if (action !== 'cancel') return;
            this.#formState = undefined;
            this.click();
            this.dispatchEvent(new Event('cancel'));
          });
        } else {
          this.click();
          this.dispatchEvent(new Event('cancel'));
        }
        break;

      default:
        if (this.form.method === 'dialog') {
          this.#formRequestSubmit();
        }
    }
  }

  #formRequestSubmit() {
    // const previousNoValidate = this.form.noValidate;
    // if (this.hasAttribute('formnovalidate')) this.form.noValidate = true;
    // intercept submit so we can inject submitter
    this.form.addEventListener('submit', (submitEvent) => {
      Object.defineProperty(submitEvent, 'submitter', {
        configurable: true,
        enumerable: true,
        get: () => this,
      });
    }, { capture: true, once: true });
    this.#internals.setFormValue(this.value);
    this.form.requestSubmit();
    // this.form.noValidate = previousNoValidate;
  }

  // used to track changes based on values
  #getFormState() {
    return [...this.form.elements].map(e => e.type === 'checkbox' ? e.checked : e.value).toString();
  }

  #formFocusIn() {
    if (this.#formState === undefined) this.#formState = this.#getFormState();
  }

  #hrefClick() {
    if (!this.target || this.target === '_self') {
      location.href = this.href;
    } else {
      window.open(this.href, '_blank');
    }
  }
}

customElements.define(MCButtonElement.tag, MCButtonElement);
