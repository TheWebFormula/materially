import HTMLComponentElement from "../HTMLComponentElement.js";
import styles from './menu-item.css' assert { type: 'css' };
import '../state-layer/index.js';


export default class MCMenuItemElement extends HTMLComponentElement {
  static tag = 'mc-menu-item';
  static useShadowRoot = true;
  static shadowRootDelegateFocus = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #button;


  constructor() {
    super();

    this.role = 'menu-item';
    this.tabIndex = this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0;
    this.render();
    this.#button = this.shadowRoot.querySelector('button');
  }

  template() {
    return /*html*/`
      <button>
        <slot name="start"></slot>
        <slot class="default-slot"></slot>
        <slot name="end"></slot>
        <mc-state-layer ripple></mc-state-layer>
      <button>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['popovertarget', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get popovertarget() {
    return this.#button.getAttribute('popovertarget');
  }
  set popovertarget(value) {
    this.#button.setAttribute('popovertarget', value);
  }

  get popoverTargetElement() {
    return this.#button.popoverTargetElement;
  }
  set popoverTargetElement(value) {
    if (!this.#button.popoverTargetElement) {
      this.insertAdjacentHTML('beforeend', `
        <svg height="4" viewBox="7 10 10 5" focusable="false" class="drop-arrow">
          <polygon
            class="down"
            stroke="none"
            fill-rule="evenodd"
            points="7 10 12 15 17 10"></polygon>
        </svg>
      `);
    }

    this.#button.popoverTargetElement = value;
  }

  get popoverTargetAction() {
    return this.#button.popoverTargetAction;
  }
  set popoverTargetAction(value) {
    this.#button.popoverTargetAction = value;
  }
}
customElements.define(MCMenuItemElement.tag, MCMenuItemElement);
