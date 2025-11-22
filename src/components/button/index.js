import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';
import { loadCut } from './angled-corners.js';
import '../progress-circular/index.js';


const targetValues = ['_blank', '_parent', '_self', '_top'];
let isCut;

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
  #button;
  #popovertarget;
  #async = false;
  #pendingPromise;
  #pendingPromiseResolve;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #asyncMouseup_bound = this.pending.bind(this);
  #formClick_bound = this.#formClick.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #hrefClick_bound = this.#hrefClick.bind(this);

  
  constructor() {
    super();

    this.role = 'button';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;

    isCut = this.closest('[cut]') !== null;
    if (isCut) this.setAttribute('cut', '');
    if (this.hasAttribute('cut')) loadCut();


    this.#internals = this.attachInternals();
    this.render();
    this.#button = this.shadowRoot.querySelector('button');
  }

  template() {
    return /*html*/`
      <button>
        <slot name="leading-icon"></slot>
        <slot class="default-slot"></slot>
        <div class="spinner"></div>
        <mc-state-layer ripple preventfocusnodename="MC-MENU-ITEM"></mc-state-layer>
      </button>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['href', 'string'],
      ['target', 'string'],
      ['async', 'boolean'],
      ['disabled', 'boolean'],
      ['type', 'string'],
      ['popovertarget', 'string'],
      ['popoverTargetAction', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();

    if (this.#async) this.addEventListener('mouseup', this.#asyncMouseup_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
 
    if (this.form && this.type !== 'button') {
      this.form.track();
      this.addEventListener('click', this.#formClick_bound, { signal: this.#abort.signal });
    }
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    this.#pendingPromise = undefined;
    this.#pendingPromiseResolve = undefined
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

  get ariaLabel() { return this.#button.ariaLabel; }
  set ariaLabel(value) {
    this.#button.ariaLabel = value;
  }

  get popovertarget() {
    return this.#popovertarget;
  }
  set popovertarget(value) {
    this.#popovertarget = value;
    this.popoverTargetElement = document.querySelector(`#${value}`);
  }

  get popoverTargetElement() {
    return this.#button.popoverTargetElement
  }
  set popoverTargetElement(value) {
    this.#button.popoverTargetElement = value;
  }

  // There are two versions because for some reason this is camel cased in html unlike almost every other attribute that is all lowercased
  get popoverTargetAction() {
    return this.#button.popoverTargetAction;
  }
  set popoverTargetAction(value) {
    this.#button.popoverTargetAction = value;
  }

  get popovertargetaction() {
    return this.#button.popoverTargetAction;
  }
  set popovertargetaction(value) {
    this.#button.popoverTargetAction = value;
  }

  get isPending() {
    return this.classList.contains('async-pending');
  }


  pending() {
    if (this.#pendingPromise) return this.#pendingPromise;

    this.classList.add('async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = `
      <mc-progress-circular style="width: 20px; height: 20px;" indeterminate class="${this.hasAttribute('filled') ? ' on-filled' : ''}${this.hasAttribute('filled-tonal') ? ' on-filled-tonal' : ''}"></mc-progress-circular>
    `;
    this.#pendingPromise = new Promise(resolve => {
      this.#pendingPromiseResolve = resolve;
    });
    return this.#pendingPromise;
  }

  resolve(value) {
    this.classList.remove('async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = '';
    this.#pendingPromiseResolve(value);
    this.#pendingPromise = undefined;
    this.#pendingPromiseResolve = undefined;
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

  async #formClick(event) {
    const type = this.type || this.#button.type;

    switch (type) {
      case 'reset':
        this.form.reset();
        break;

      case 'submit':
        // this.#internals.setFormValue('test');
        const canSubmit = this.form.requestSubmit(this);
        if (canSubmit === false && this.#async) this.resolve();
        break;

      case 'cancel':
        const prevent = this.hasAttribute('formnovalidate') ? false : await this.form.formState.preventUnsavedChanges(event);
        if (prevent) {
          return;
        } else {
          this.dispatchEvent(new Event('cancel', { bubbles: true }));
        }
        break;

      default:
        if (this.form.method === 'dialog') {
          this.#internals.setFormValue(this.value);
          this.form.requestSubmit(event);
        }
    }
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
