import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './anchor-group.css' assert { type: 'css' };
import { expand_more_FILL0_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';


class WFCAnchorGroupElement extends HTMLComponentElement {
  static tag = 'wfc-anchor-group';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #control;
  #open = false;
  #controlClick_bound = this.#controlClick.bind(this);

  constructor() {
    super();

    this.render();
    this.#control = this.shadowRoot.querySelector('[control]');
  }

  template() {
    return /*html*/`
      <wfc-anchor control>
        <slot name="control"></slot>
        <span slot="trailing-icon" class="arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</span>
      </wfc-anchor>
      <slot class="default-slot"></slot>
    `;
  }

  connectedCallback() {
    this.#control.addEventListener('click', this.#controlClick_bound);
  }

  disconnectedCallback() {
    this.#control.removeEventListener('click', this.#controlClick_bound);
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    if (this.#open === !!value) return;

    this.#open = !!value;
    if (this.#open) {
      this.#control.classList.add('open');
      if (!this.parentElement.classList.contains('wfc-state-rail')) this.style.setProperty('--wfc-navigation-drawer-group-height', `${this.#fullHeight}px`);
    } else {
      this.style.setProperty('--wfc-navigation-drawer-group-height', '0px');
      this.#control.classList.remove('open');
    }
  }

  get #fullHeight() {
    return [...this.querySelectorAll('wfc-anchor')].length * 58;
  }

  #controlClick(event) {
    this.open = !this.open;
    event.preventDefault();
    event.stopPropagation();
  }
}

customElements.define(WFCAnchorGroupElement.tag, WFCAnchorGroupElement);
