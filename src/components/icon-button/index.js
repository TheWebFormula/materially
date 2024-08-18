import MCButtonElement from '../button/index.js';
import styles from './component.css' assert { type: 'css' };
import '../state-layer/index.js';


export default class MCIconButtonElement extends MCButtonElement {
  static tag = 'mc-icon-button';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];
  static formAssociated = true;


  #toggle;
  #checked;
  #button;
  #popovertarget;
  #click_bound = this.#click.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.#button = this.shadowRoot.querySelector('button');
  }

  template() {
    return /*html*/`
      <button>
        <slot class="default-slot"></slot>
        <slot name="selected"></slot>
      </button>
      <div class="spinner"></div>
      <mc-state-layer ripple></mc-state-layer>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['href', 'string'],
      ['target', 'string'],
      ['toggle', 'boolean'],
      ['checked', 'boolean'],
      ['popovertarget', 'string'],
      ['popoverTargetAction', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get toggle() { return this.#toggle; }
  set toggle(value) {
    this.#toggle = !!value;
  }

  get checked() { return this.#checked; }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('selected', this.#checked);
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

  connectedCallback() {
    super.connectedCallback();

    if(this.#toggle) {
      this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
      this.addEventListener('click', this.#click_bound);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
    this.removeEventListener('click', this.#click_bound);
  }


  #click() {
    this.checked = !this.checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #slotChange(event) {
    if (event.target.name === 'selected') {
      this.classList.toggle('selected-icon', event.target.assignedElements().length > 0);
    }
  }
}
customElements.define(MCIconButtonElement.tag, MCIconButtonElement);
