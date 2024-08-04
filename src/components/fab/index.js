import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';
import util from '../../helpers/util.js';


class MCFabElement extends HTMLComponentElement {
  static tag = 'mc-fab';
  static useShadowRoot = true;
  static shadowRootDelegateFocus = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #autoHide;
  #autoHideLabel;
  #maxWidth;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);

  constructor() {
    super();

    this.role = 'button';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.render();
  }

  template() {
    return /* html */`
      <button>
        <slot class="icon"></slot>
        <slot name="label"></slot>
      </button>
      <mc-state-layer ripple></mc-state-layer>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['auto-hide', 'boolean'],
      ['auto-hide-label', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  disconnectedCallback() {
    util.untrackPageScroll(this.#scrollDirectionChange_bound);
  }


  get autoHide() { return this.#autoHide; }
  set autoHide(value) {
    this.#autoHide = !!value;
    this.toggleAttribute('auto-hide', this.#autoHide);

    this.style.maxWidth = '';
    this.classList.remove('hide-label');
    if (!this.#autoHide) util.untrackPageScroll(this.#scrollDirectionChange_bound);
    if (this.#autoHide || this.#autoHideLabel) this.#enableAutoHide();
  }

  get autoHideLabel() { return this.#autoHideLabel; }
  set autoHideLabel(value) {
    this.#autoHideLabel = !!value;
    this.toggleAttribute('auto-hide-label', this.#autoHideLabel);

    if (!this.#autoHideLabel) {
      util.untrackPageScroll(this.#scrollDirectionChange_bound);
      this.style.maxWidth = '';
      this.classList.remove('hide-label');
    }
    if (this.#autoHide || this.#autoHideLabel) this.#enableAutoHide();
  }


  #enableAutoHide() {
    this.#maxWidth = this.offsetWidth;
    this.style.maxWidth = `${this.#maxWidth}px`;
    util.trackPageScroll(this.#scrollDirectionChange_bound);
    if (!this.classList.contains('mc-animation')) this.classList.add('mc-animation')
  }

  #scrollDirectionChange({ direction, directionChange }) {
    if (!directionChange) return;

    if (direction === 1) {
      this.style.maxWidth = `${this.#maxWidth}px`;
      if (this.#autoHide) {
        this.classList.remove('hide');
      } else {
        this.classList.remove('hide-label');
      }
    } else {
      this.style.maxWidth = '0px';
      if (this.#autoHide) {
        this.classList.add('hide');
      } else {
        this.classList.add('hide-label');
      }
    }
  }
}
customElements.define(MCFabElement.tag, MCFabElement);
