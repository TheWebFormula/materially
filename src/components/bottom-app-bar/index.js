import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from './../../helpers/util.js';


class MCBottomAppBarElement extends HTMLComponentElement {
  static tag = 'mc-bottom-app-bar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #autoHide;
  #hide = false;
  #secondaryHash;

  #slotChange_bound = this.#slotChange.bind(this);
  #scroll_bound = this.#scroll.bind(this);
  #hashchange_bound = this.#hashchange.bind(this);


  constructor() {
    super();

    this.render();
    this.#autoHide = this.hasAttribute('auto-hide');
    if (this.#secondaryHash) this.#hashchange();
  }

  template() {
    return /*html*/`
      <slot class="default-slot"></slot>
      <slot name="secondary"></slot>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['secondary-hash', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get secondaryHash() { return this.#secondaryHash; }
  set secondaryHash(value) {
    this.#secondaryHash = value;
    if (!!this.#secondaryHash) window.addEventListener('hashchange', this.#hashchange_bound);
    else window.removeEventListener('hashchange', this.#hashchange_bound);
  }

  get hide() {
    return this.#hide;
  }
  set hide(value) {
    this.#hide = !!value;
    this.classList.toggle('hide', !!value);
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
    if (this.#autoHide) util.trackPageScroll(this.#scroll_bound);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
    util.untrackPageScroll(this.#scroll_bound);
    window.removeEventListener('hashchange', this.#hashchange_bound);
  }

  async showPrimary() {
    const primary = this.shadowRoot.querySelector('.default-slot');
    primary.classList.remove('hide');

    const currentSecondary = this.shadowRoot.querySelector('[name="secondary"].show');
    if (currentSecondary) currentSecondary.classList.remove('show');
  }

  async showSecondary() {
    const secondary = this.shadowRoot.querySelector('[name="secondary"]');
    if (!secondary) {
      console.error('Could not find secondary bottom-app-bar content');
      return;
    }
    secondary.classList.add('show');

    const primary = this.shadowRoot.querySelector('.default-slot');
    primary.classList.add('hide');
  }

  #hashchange() {
    if (location.hash === this.#secondaryHash) this.showSecondary();
    else this.showPrimary();
  }

  #slotChange(event) {
    event.target.assignedElements().forEach((el, i) => el.setAttribute('place', i + 1));
  }

  #scroll({ distanceFromDirectionChange  }) {
    if (this.hide && distanceFromDirectionChange < -30) this.hide = false;
    if (!this.hide && distanceFromDirectionChange > 30) this.hide = true;
  }
}
customElements.define(MCBottomAppBarElement.tag, MCBottomAppBarElement);
