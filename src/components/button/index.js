import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';
// import dialog from '../dialog/service.js';

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
  #target;
  #href;
  #type;
  #button;
  #value;
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

    this.#internals = this.attachInternals();

    this.role = 'button';
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
      <mc-state-layer ripple></mc-state-layer>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['href', 'string'],
      ['target', 'string'],
      // ['type', 'string'],
      ['value', 'string'],
      // ['form', 'string'],
      ['async', 'boolean'],
      ['disabled', 'boolean'],
      ['popovertarget', 'string']
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

  // get type() { return this.#type; }
  // set type(value) {
  //   this.#type = value;
  //   this.#button.setAttribute('type', value);
  //   if (['reset', 'cancel', 'submit'].includes(value) && !this.#form && this.parentElement.nodeName === 'FORM') {
  //     this.#form = this.parentElement;
  //   }
  // }

  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    this.#button.setAttribute('value', value);
    // if (this.form) this.#internals.setFormValue(value);
  }

  // get form() { return this.#form }
  // set form(value) {
  //   console.log(document.querySelector(`form#${value}`))
  //   this.#form = document.querySelector(`form#${value}`);
  //   // this.#button.form = value;
  //   // this.#form = document.querySelector(`form#${value}`);
  // }

  get form() {
    return this.#internals.form;
  }

  get async() { return this.#async }
  set async(value) {
    this.#async = !!value;
  }

  // get formNoValidate() { return this.hasAttribute('formnovalidate'); }
  // set formNoValidate(value) {
  //   if (!!value) this.setAttribute('formnovalidate', '');
  //   else this.removeAttribute('formnovalidate');
  // }

  // get popovertarget() {
  //   return this.#button.getAttribute('popovertarget');
  // }
  // set popovertarget(value) {
  //   this.#button.setAttribute('popovertarget', value);
  // }

  // get popoverTargetElement() {
  //   return this.#button.popoverTargetElement;
  // }
  // set popoverTargetElement(value) {
  //   this.#button.popoverTargetElement = value;
  // }

  // get popoverTargetAction() {
  //   return this.#button.popoverTargetAction;
  // }
  // set popoverTargetAction(value) {
  //   this.#button.popoverTargetAction = value;
  // }

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
    if (e.key === 'Enter') this.shadowRoot.querySelector('mc-state-layer').triggerRipple();
  }

  // prevent onclick attribute from firing when form invalid
  #formMouseDown() {
    if (this.#type === 'cancel' && this.onclick && this.#formState !== undefined && this.#getFormState() !== this.#formState) {
      this.#onclickValue = this.onclick;
      this.onclick = undefined;
    }
  }

  #formMouseUp() {
    if (this.#type === 'cancel' && this.#onclickValue) {
      setTimeout(() => {
        this.onclick = this.#onclickValue;
        this.#onclickValue = undefined;
      });
    }
  }

  async #formClick(event) {
    this.#formRequestSubmit();
    return;

    switch (this.#type) {
      case 'reset':
        this.form.reset();
        break;

      case 'submit':
        if (!this.formNoValidate && !this.form.hasAttribute('novalidate') && !this.form.checkValidity()) {
          const formElements = [...this.form.elements];
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
          });
        }
        break;

      default:
        if (this.form.method === 'dialog') {
          this.#formRequestSubmit();
        }
    }
  }

  #formRequestSubmit() {
    const previousNoValidate = this.form.noValidate;
    if (this.formNoValidate) this.form.noValidate = true;
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
    if (this.formNoValidate) this.form.noValidate = previousNoValidate;
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
