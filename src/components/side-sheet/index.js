import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import {
  close_FILL0_wght400_GRAD0_opsz24,
  arrow_back_FILL1_wght300_GRAD0_opsz24
} from '../../helpers/svgs.js';

// TODO predictive back

export default class MCSideSheetElement extends HTMLComponentElement {
  static tag = 'mc-side-sheet';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #open = false;
  #openSet = false;
  #modalSet = false;
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #close_bound = this.close.bind(this);
  #redispatchBack_bound = this.#redispatchBack.bind(this);
  #formSubmit_bound = this.#formSubmit.bind(this);

  constructor() {
    super();

    // if modal or open is added initially we want to prevent automatic changing based on window size
    this.#openSet = this.hasAttribute('open');
    this.#modalSet = this.hasAttribute('modal');
    this.#windowStateChange({ detail: device });
    this.render();
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="surface">
        <div class="surface-content">
          <slot name="header"></slot>
          <div class="header">
            <mc-icon-button class="back" aria-label="back">
              <mc-icon>${arrow_back_FILL1_wght300_GRAD0_opsz24}</mc-icon>
            </mc-icon-button>
            <slot name="headline"></slot>
            <mc-icon-button class="close" aria-label="close">
              <mc-icon>${close_FILL0_wght400_GRAD0_opsz24}</mc-icon>
            </mc-icon-button>
          </div>
          <slot class="default-slot"></slot>
          <div class="actions">
            <mc-divider></mc-divider>
            <slot name="action"></div>
          </div>
        </div>
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['open', 'boolean'],
      ['align-left', 'boolean'],
      ['modal', 'boolean'],
      ['scrim', 'boolean'],
      ['prevent-close', 'boolean'],
      ['inset', 'boolean'],
      ['hide-close', 'boolean'],
      ['back', 'boolean'],
      ['onback', 'event']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    if (!this.hideClose) this.shadowRoot.querySelector('.close').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    if (this.back) this.shadowRoot.querySelector('.back').addEventListener('click', this.#redispatchBack_bound, { signal: this.#abort.signal });
    if (!this.preventClose && this.scrim) {
      this.shadowRoot.querySelector('.scrim').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    }
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });

    let form = this.querySelector('form[method=dialog]');
    if (form) {
      form.addEventListener('submit', this.#formSubmit_bound, { signal: this.#abort.signal });

      let cancelButton = this.querySelector('mc-button[form][type=cancel]');
      if (cancelButton) cancelButton.addEventListener('cancel', this.#close_bound, { signal: this.#abort.signal });
    }
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = !!value;
    this.classList.toggle('open', this.#open);
  }

  get modal() {
    return this.hasAttribute('modal');
  }
  set modal(value) {
    this.toggleAttribute('modal', !!value);
  }

  get alignLeft() {
    return this.hasAttribute('align-left');
  }
  set alignLeft(value) {
    this.toggleAttribute('align-left', !!value);
  }

  get scrim() { return this.hasAttribute('scrim'); }
  set scrim(value) {
    this.toggleAttribute('scrim', !!value);
  }

  get preventClose() { return this.hasAttribute('prevent-close'); }
  set preventClose(value) {
    this.toggleAttribute('prevent-close', !!value);
  }

  get inset() { return this.hasAttribute('inset'); }
  set inset(value) {
    this.toggleAttribute('inset', !!value);
  }

  get hideClose() { return this.hasAttribute('hide-close'); }
  set hideClose(value) {
    this.toggleAttribute('hide-close', !!value);
  }

  get back() { return this.hasAttribute('back'); }
  set back(value) {
    this.toggleAttribute('back', !!value);
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  show() {
    const change = this.open === false;
    this.open = true;
    if (change) this.dispatchEvent(new CustomEvent('change'));
  }

  close() {
    const change = this.open === true;
    this.open = false;
    if (change) this.dispatchEvent(new CustomEvent('change'));
  }

  #windowStateChange({ detail }) {
    const state = detail.state;
    if (!this.#modalSet) this.modal = state === device.COMPACT;
    if (!this.#openSet) this.open = state !== device.COMPACT;
  }

  #redispatchBack() {
    this.dispatchEvent(new CustomEvent('back'));
  }

  #formSubmit(event) {
    this.close();
  }
}

customElements.define(MCSideSheetElement.tag, MCSideSheetElement);
