import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import {
  close_FILL0_wght400_GRAD0_opsz24,
  arrow_back_FILL1_wght300_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../helpers/svgs.js';

// TODO predictive back

export default class WFCSideSheetElement extends HTMLComponentElement {
  static tag = 'wfc-side-sheet';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #openSet = false;
  #modalSet = false;
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #scrimClick_bound = this.#scrimClick.bind(this);
  #close_bound = this.#close.bind(this);
  #redispatchBack_bound = this.#redispatchBack.bind(this);

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
            <wfc-icon-button class="back" aria-label="back">
              <wfc-icon>${arrow_back_FILL1_wght300_GRAD0_opsz24}</wfc-icon>
            </wfc-icon-button>
            <slot name="headline"></slot>
            <wfc-icon-button class="close" aria-label="close">
              <wfc-icon>${close_FILL0_wght400_GRAD0_opsz24}</wfc-icon>
            </wfc-icon-button>
          </div>
          <slot class="default-slot"></slot>
          <div class="actions">
            <wfc-divider></wfc-divider>
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
      ['allow-close', 'boolean'],
      ['inset', 'boolean'],
      ['hide-close', 'boolean'],
      ['back', 'boolean'],
      ['onback', 'event']
      // ['global', 'boolean'],
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    if (!this.hideClose) this.shadowRoot.querySelector('.close').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    if (this.back) this.shadowRoot.querySelector('.back').addEventListener('click', this.#redispatchBack_bound, { signal: this.#abort.signal });
    if (this.allowClose && this.scrim) {
      this.shadowRoot.querySelector('.scrim').addEventListener('click', this.#scrimClick_bound, { signal: this.#abort.signal });
    }
    window.addEventListener('wfcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }

  get open() {
    return this.getAttribute('open');
  }
  set open(value) {
    this.toggleAttribute('open', !!value);
  }

  get modal() {
    return this.getAttribute('modal');
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

  get allowClose() { return this.hasAttribute('allow-close'); }
  set allowClose(value) {
    this.toggleAttribute('allow-close', !!value);
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


  #windowStateChange({ detail }) {
    const state = detail.state;
    if (!this.#modalSet) this.modal = state === device.COMPACT;
    // TODO medium with rail
    if (!this.#openSet) this.open = state !== device.COMPACT;
  }

  #scrimClick() {
    this.open = false;
  }

  #close() {
    this.open = false;
  }

  #redispatchBack() {
    this.dispatchEvent(new CustomEvent('back'));
  }
}

customElements.define(WFCSideSheetElement.tag, WFCSideSheetElement);
