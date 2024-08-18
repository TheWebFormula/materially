import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './chip-set.css' assert { type: 'css' };


class MCChipSetElement extends HTMLComponentElement {
  static tag = 'mc-chip-set';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #label;
  #input;
  #inputElement;
  #edit;
  #inputFocus_bound = this.#inputFocus.bind(this);
  #inputBlur_bound = this.#inputBlur.bind(this);
  #createChip_bound = this.#createChip.bind(this);


  constructor() {
    super();

    this.render();
    this.#inputElement = this.shadowRoot.querySelector('input');
  }

  template() {
    return /*html*/`
      <div class="label"></div>
      <slot></slot>
      <input />
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['label', 'string'],
      ['value', 'string'],
      ['input', 'boolean'],
      ['edit', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get values() {
    return [...this.querySelectorAll('mc-chip')].map(chip => chip.valueObject);
  }

  get input() { return this.#input; }
  set input(value) { this.#input = !!value; }

  get edit() { return this.#edit; }
  set edit(value) { this.#edit = !!value; }

  get label() { return this.#label; }
  set label(value) {
    this.#label = value;
    const label = this.shadowRoot.querySelector('.label');
    label.textContent = value;
    label.classList.toggle('has-label', !!value);
    if (this.#inputElement) this.#inputElement.ariaLabel = value;
  }


  connectedCallback() {
    if (this.#input) this.#inputElement.addEventListener('focus', this.#inputFocus_bound);
    // checking the slot covers chip sets in search
    // const slot = this.querySelector('[name="chips"]');
    // const chipLength = slot ? slot.assignedElements().length : this.querySelectorAll('mc-chip').length;
    // if (chipLength > 0) {
    //   this.#drag = new Drag(this);
    //   this.#drag.disableTouchEvents = true;
    //   this.#drag.horizontalOnly = true;
    //   this.#drag.lockScrollY = true;
    //   this.#drag.on('mcdragmove', this.#scrollDrag_bound);
    //   this.#drag.enable();
    // }
  }

  disconnectedCallback() {
    this.#inputElement.removeEventListener('focus', this.#inputFocus_bound);
  }

  addChip(params = {
    type: 'suggestion',
    edit: false,
    label: '',
    value: '',
    checked: false,
    name: ''
  }) {
    this.insertAdjacentHTML('beforeend', `<mc-chip ${params.type}${params.edit ? ` edit` : ''}${params.checked ? ` checked` : ''}${params.value !== undefined ? ` value="${params.value}"` : ''}${params.label !== undefined ? ` label="${params.label}"` : ''}></mc-chip>`);
  }


  #inputFocus() {
    this.#inputElement.addEventListener('blur', this.#inputBlur_bound);
    this.#inputElement.addEventListener('keydown', this.#createChip_bound);
  }

  #inputBlur() {
    this.#inputElement.removeEventListener('blur', this.#inputBlur_bound);
    this.#inputElement.removeEventListener('keydown', this.#createChip_bound);
  }

  #createChip(event) {
    if (event.key === 'Backspace' && !this.#inputElement.value) {
      const lastChip = this.querySelector('mc-chip:last-child');
      if (lastChip) requestAnimationFrame(() => lastChip.focus());
      event.stopPropagation();
      return;
    }
    if (event.key !== 'Enter' || !this.#inputElement.value) return;
    this.insertAdjacentHTML('beforeend', `<mc-chip input${this.#edit ? ' edit' : ''} value="${this.#inputElement.value}"></mc-chip>`);
    this.#inputElement.value = '';
    this.dispatchEvent(new Event('change'));
  }
}
customElements.define(MCChipSetElement.tag, MCChipSetElement);
