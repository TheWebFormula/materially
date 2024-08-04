import MCMenuItemElement from '../menu/menu-item.js';
import util from '../../helpers/util.js';


class MCOptionElement extends MCMenuItemElement {
  static tag = 'mc-option';


  #value;
  #displayValue;
  #selected = false;


  constructor() {
    super();

    this.role = 'option';
  }


  static get observedAttributesExtended() {
    return [
      ['selected', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#displayValue = util.getTextFromNode(this);
    this.#value = this.getAttribute('value') || this.#displayValue;
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  get displayValue() {
    return this.#displayValue;
  }

  get selected() { return this.#selected; }
  set selected(value) {
    this.#selected = value !== null && value !== false;
    this.classList.toggle('selected', this.#selected);
  }
}
customElements.define(MCOptionElement.tag, MCOptionElement);
