import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';


export default class MCSurfaceElement extends HTMLComponentElement {
  static tag = 'mc-surface';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #dialog;
  #anchor;
  #height;
  #overlay = true;
  #allowClose = false;
  #removeOnClose = false;
  #closeIgnoreElements = [];
  #handleCancel_bound = this.#handleCancel.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #preventEsc_bound = this.#preventEsc.bind(this);
  #clickOutsideClose_bound = this.#clickOutsideClose.bind(this);
  #scroll_bound = this.#scroll.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    this.render();
    this.#dialog = this.shadowRoot.querySelector('dialog');
  }

  template() {
    return /*html*/`
      <dialog>
        <slot></slot>
      </dialog>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['anchor', 'string'],
      ['allow-close', 'boolean'],
      ['remove-on-close', 'boolean'],
      ['fullscreen', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  connectedCallback() {
    this.#abort = new AbortController();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }


  get open() { return this.hasAttribute('open'); }

  get anchor() { return this.#anchor; }
  set anchor(value) {
    if (value === null) this.#anchor = null;
    else if (value === '') this.#anchor = this.parentElement;
    else if (value instanceof HTMLElement) this.#anchor = value;
    else this.#anchor = document.querySelector(`#${value}`);

    this.toggleAttribute('anchor', value !== null);
  }

  get allowClose() { return this.#allowClose; }
  set allowClose(value) {
    this.#allowClose = !!value;
    this.toggleAttribute('allow-close', this.#allowClose);
  }

  get removeOnClose() { return this.#removeOnClose; }
  set removeOnClose(value) { this.#removeOnClose = !!value; }

  get fullscreen() { return this.hasAttribute('fullscreen'); }
  set fullscreen(value) { this.toggleAttribute('fullscreen', !!value); }

  get noScrim() { return this.hasAttribute('no-scrim'); }
  set noScrim(value) { this.toggleAttribute('no-scrim', !!value); }

  get closeIgnoreElements() { return this.#closeIgnoreElements; }
  set closeIgnoreElements(value) {
    this.#closeIgnoreElements = Array.isArray(value) ? value : [];
  }


  show() {
    this.#showBefore();
    this.#dialog.show();
    this.#setAnchorPosition();
    window.addEventListener('scroll', this.#scroll_bound, { signal: this.#abort.signal });
    this.#showAfter();
  }

  showModal() {
    this.#showBefore();
    this.#dialog.showModal();
    this.#showAfter();
  }

  close(returnValue) {
    const previousReturnValue = this.returnValue;
    this.returnValue = returnValue;

    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      this.returnValue = previousReturnValue;
      return;
    }

    this.#dialog.close(returnValue);
  }

  #showBefore() {
    this.#dialog.classList.add('get-height');
    this.#height = this.#dialog.offsetHeight;
    this.setAttribute('open', '');
    this.#dialog.classList.remove('get-height');
  }

  #showAfter() {
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    if (!this.#allowClose) window.addEventListener('keydown', this.#preventEsc_bound, { signal: this.#abort.signal });
    else {
      // prevent immediate close because of click propagation
      window.addEventListener('pointerup', () => {
        setTimeout(() => {
          window.addEventListener('pointerup', this.#clickOutsideClose_bound, { signal: this.#abort.signal });
        });
      }, { once: true });
    }
  }


  #setAnchorPosition() {
    if (!this.#anchor) return;

    const bounds = this.#anchor.getBoundingClientRect();
    let top = bounds.bottom + 8;
    let bottom = 'unset';
    let left = bounds.left;
    let belowOutOfBounds = top + this.#height > window.innerHeight;
    let aboveOutOfBounds = (bounds.top - this.#height) < 8;

    // shift above
    if (belowOutOfBounds && !aboveOutOfBounds) {
      bottom = `${window.innerHeight - bounds.top + 8}px`;
      top = 'unset';

    // shift up and overlay
    } else if (belowOutOfBounds && this.#overlay) {
      top -= (top + this.#height) - (window.innerHeight - 8);
      top = `${top}px`;

    // keep below
    } else {
      top = `${top}px`;
    }

    this.#dialog.style.top = top;
    this.#dialog.style.bottom = bottom;
    this.#dialog.style.left = `${left}px`;
  }

  #preventEsc(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async #handleClose() {
    this.removeAttribute('open');
    this.#dialog.removeEventListener('cancel', this.#handleCancel_bound);
    this.#dialog.removeEventListener('close', this.#handleClose_bound);
    window.removeEventListener('keydown', this.#preventEsc_bound);
    window.removeEventListener('pointerup', this.#clickOutsideClose_bound);
    window.removeEventListener('scroll', this.#scroll_bound);
    if (this.removeOnClose) {
      await util.animationendAsync(this.#dialog);
      this.parentElement.removeChild(this);
    }
  }

  #handleCancel(event) {
    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      event.preventDefault();
      return;
    }

    const preventCancel = !this.dispatchEvent(new Event('cancel', { cancelable: true }));
    if (preventCancel) event.preventDefault();
  }

  #clickOutsideClose(event) {
    let ignore = this.#closeIgnoreElements.find(e => e === event.target || e.contains(event.target));
    if (!ignore && event.target !== this && !this.contains(event.target)) this.close();
  }

  #scroll() {
    this.#setAnchorPosition();
  }
}
customElements.define(MCSurfaceElement.tag, MCSurfaceElement);
