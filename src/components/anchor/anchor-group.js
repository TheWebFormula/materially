import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './anchor-group.css' assert { type: 'css' };
import stylesAnchor from './anchor-drawer.css' assert { type: 'css' };
import { expand_more_FILL0_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';


class MCAnchorGroupElement extends HTMLComponentElement {
  static tag = 'mc-anchor-group';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles, stylesAnchor];

  #control;
  #open = false;
  #controlClick_bound = this.#controlClick.bind(this);

  constructor() {
    super();

    this.role = 'group';
    this.render();
    this.#control = this.shadowRoot.querySelector('[control]');
  }

  template() {
    return /*html*/`
      <a control role="button" tabIndex="-1">
        <slot name="control"></slot>
        <span slot="trailing-icon" class="arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</span>
      </a>
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
      if (!this.parentElement.classList.contains('mc-state-rail')) this.style.setProperty('--mc-navigation-drawer-group-height', `${this.#fullHeight}px`);
    } else {
      this.style.setProperty('--mc-navigation-drawer-group-height', '0px');
      this.#control.classList.remove('open');
    }
  }

  get #fullHeight() {
    return [...this.querySelectorAll('a')].length * 58;
  }

  #controlClick(event) {
    this.open = !this.open;
    event.preventDefault();
    event.stopPropagation();
  }
}

customElements.define(MCAnchorGroupElement.tag, MCAnchorGroupElement);
