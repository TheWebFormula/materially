import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './group.css' assert { type: 'css' };
import device from '../../helpers/device.js';

// TODO fix wonkyness when resizing. Card placement can get messed up (empty gaps)
// TODO fix fullscreen transition

export default class MCCardGroupElement extends HTMLComponentElement {
  static tag = 'mc-card-group';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #abort;
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #layout_bound = this.#layout.bind(this);


  constructor() {
    super();

    this.render();
  }

  template() {
    return '<slot></slot>';
  }

  static get observedAttributesExtended() {
    return [
      ['reorder', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();

    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#layout_bound, { signal: this.#abort.signal });
    window.addEventListener('resize', this.#layout_bound, { signal: this.#abort.signal });
    this.#windowStateChange();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }

  get reorder() { return this.hasAttribute('reorder'); }
  set reorder(value) {
    this.toggleAttribute('reorder', !!value);
  }

  get #isGrid() {
    return !this.classList.contains('list') && (this.classList.contains('grid') || (!this.classList.contains('grid') && device.state !== device.COMPACT));
  }

  #windowStateChange() {
    this.classList.toggle('window-compact', device.state === device.COMPACT);
    requestAnimationFrame(() => {
      this.#layout(); 
    });
  }

  #layout() {
    if (this.#isGrid) this.#layoutGrid();
    else this.#layoutList();
  }

  #layoutList() {
    // this.classList.remove('grid');
    [...this.querySelectorAll('mc-card')].map((element, i) => {
      element.classList.remove('grid');
    });
  }

  #layoutGrid() {
    // this.classList.add('grid');
    // this.classList.remove('list');

    const cards = [...this.querySelectorAll('mc-card')].map((element, i) => {
      element.classList.add('grid');
      element.style.order = i;
      return {
        order: i,
        height: element.height,
        element
      };
    }).sort((a, b) => a.height - b.height);
    if (cards.length === 0) return;

    const baseHeight = cards[0].height;
    this.style.setProperty('--mc-card-group-row-height', `${baseHeight}px`);

    cards.forEach(({ element, height }) => {
      if (element.classList.contains('show')) return;

      const span = Math.ceil(height / baseHeight);
      if (baseHeight > 1) element.style.gridRowEnd = `span ${span}`;
    });

    // auto adjust column count to keep content on screen
    const overFlow = this.scrollWidth - this.offsetWidth;
    if (overFlow > 0) {
      let cardWidth = 0;
      [...this.querySelectorAll('mc-card')].forEach(card => {
        if (card.offsetWidth > cardWidth) cardWidth = card.offsetWidth;
      });
      this.style.setProperty('--mc-card-group-columns', Math.max(1, Math.floor(this.offsetWidth / cardWidth)));
    }
  }
}

customElements.define(MCCardGroupElement.tag, MCCardGroupElement);
