import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './anchor.css' assert { type: 'css' };
import util from '../../helpers/util.js';

const targetValues = ['_blank', '_parent', '_self', '_top'];

class MCAnchorElement extends HTMLComponentElement {
  static tag = 'mc-anchor';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];

  #link;
  #abort;
  #target;
  #badge;
  #ariaLabelOriginal;
  #click_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);

  constructor() {
    super();

    this.role = 'link';
    this.tabIndex = 0;
    this.render();

    this.#link = this.shadowRoot.querySelector('a');
  }

  template() {
    return /*html*/`
      <a part="a">
        <slot name="leading-icon"></slot>
        <slot class="default-slot"></slot>
        <slot name="trailing-icon"></slot>
        <span class="badge-display"></span>
      </a>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['href', 'string'],
      ['badge', 'number'],
      ['target', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.addEventListener('click', this.#click_bound, { signal: this.#abort.signal });
    this.addEventListener('focusin', this.#focus_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
  }


  get href() { return this.#link.href; }
  set href(value) {
    if (!value) {
      this.removeAttribute('href');
      this.#link.removeAttribute('href');
    } else {
      this.setAttribute('href', value);
      this.#link.setAttribute('href', value);
    }
  }

  get target() { return this.#target; }
  set target(value) {
    if (value && !targetValues.includes(value)) throw Error(`Invalid target value. Valid values ${targetValues.join(', ')}`);
    this.#target = value;
    this.#link.setAttribute('target', value);
  }

  get badge() { return this.#badge; }
  set badge(value) {
    if (value === 0) value = '';
    if (value > 999) value = '999+';
    this.#badge = value;
    this.shadowRoot.querySelector('.badge-display').innerText = value;

    if (!this.#ariaLabelOriginal) this.#ariaLabelOriginal = this.ariaLabel || util.getTextFromNode(this);
    if (!value) this.ariaLabel = this.#ariaLabelOriginal;
    else this.ariaLabel = `[${this.#ariaLabelOriginal}] ${value} New ${value === 1 ? 'notification' : 'notifications'}`;
  }


  #click() {
    this.classList.add('animate');
    requestAnimationFrame(() => {
      this.classList.remove('animate');
      this.blur();
    });
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.code === 'Tab') {
      const pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
      const firstFocusablePageContent = util.getNextFocusableElement(pageContent.children[0], false);
      if (firstFocusablePageContent) firstFocusablePageContent.focus();
      e.preventDefault();
    } if (e.code === 'Enter' || e.code === 'Space') {
      this.click();
      this.blur();
      e.preventDefault();
    } else if (e.code === 'ArrowDown') {
      const next = util.getNextFocusableElement(e.target, false, this.#acceptFilter);
      if (next) next.focus();
      e.preventDefault();
    } else if (e.code === 'ArrowUp') {
      const next = util.getNextFocusableElement(e.target, true, this.#acceptFilter);
      if (next) next.focus();
      e.preventDefault();
    }
  }

  #acceptFilter(element) {
    return element.nodeName === 'MC-ANCHOR' && !element.hasAttribute('control');
  }

  #slotChange(event) {
    if (event.target.classList.contains('default-slot')) {
      let hasText = false;
      for (let node of event.target.assignedNodes()) {
        if (node.data && node.data.trim() !== '') {
          hasText = true;
          break;
        }
      }
      if (hasText === false) this.classList.add('no-text');
    }
  }
}
customElements.define(MCAnchorElement.tag, MCAnchorElement);
