import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from './../../helpers/util.js';

// TODO make fullscreen start from anchor

export default class MCSurfaceElement extends HTMLComponentElement {
  static tag = 'mc-surface';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #dialog;
  #anchor;
  #height;
  #offsetY = 0;
  #offsetX = 0;
  #anchorRight = false;
  #overlay = true;
  #allowClose = false;
  #alwaysBelow = false;
  #removeOnClose = false;
  #closeIgnoreElements = [];
  #handleCancel_bound = this.#handleCancel.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #handleEsc_bound = this.#handleEsc.bind(this);
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
      ['always-below', 'boolean'],
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
    if (this.anchor && value !== null) return;
    else if (value === null) this.#anchor = null;
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

  get offsetY() { return this.#offsetY; }
  set offsetY(value) { this.#offsetY = value || 0; }

  get offsetX() { return this.#offsetX; }
  set offsetX(value) { this.#offsetX = value || 0; }

  get overlay() { return this.#overlay; }
  set overlay(value) { this.#overlay = !!value; }

  get anchorRight() { return this.#anchorRight; }
  set anchorRight(value) { this.#anchorRight = !!value; }

  get alwaysBelow() { return this.#alwaysBelow; }
  set alwaysBelow(value) { this.#alwaysBelow = !!value; }


  show() {
    if (this.open) return;
    this.#showBefore();
    this.#dialog.show();
    this.#setAnchorPosition();
    window.addEventListener('scroll', this.#scroll_bound, { signal: this.#abort.signal });
    this.#showAfter();
  }

  showModal() {
    if (this.open) return;
    this.#showBefore();
    this.#dialog.showModal();
    this.#showAfter();
  }

  close(returnValue) {
    if (!this.open) return;
    const previousReturnValue = this.returnValue;
    this.returnValue = returnValue;

    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      this.returnValue = previousReturnValue;
      return;
    }

    this.#dialog.close(returnValue);
  }

  setPosition() {
    this.style.maxHeight = '';
    this.#height = this.#dialog.offsetHeight;
    this.#setAnchorPosition();
  }

  #showBefore() {
    this.style.maxHeight = '';
    this.#dialog.classList.add('get-height');
    this.#height = this.#dialog.offsetHeight;
    this.setAttribute('open', '');
    this.#dialog.classList.remove('get-height');
  }

  #showAfter() {
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });

    window.addEventListener('keydown', this.#handleEsc_bound, { signal: this.#abort.signal });

    if (this.#allowClose) {
      
      if (util.pointerDown) {
        // prevent immediate close because of click propagation
        window.addEventListener('click', () => {
          console.log('click');
          setTimeout(() => {
            if (this.open) window.addEventListener('click', this.#clickOutsideClose_bound, { signal: this.#abort.signal });
          });
        }, { once: true });
      } else {
        setTimeout(() => {
          window.addEventListener('click', this.#clickOutsideClose_bound, { signal: this.#abort.signal });
        });
      }
    }
    this.dispatchEvent(new Event('open', { bubbles: true }));
  }

  #setAnchorPosition() {
    if (!this.#anchor || this.fullscreen) return;

    const bounds = this.#anchor.getBoundingClientRect();
    let top = bounds.bottom;
    let bottom = 'unset';
    let left = bounds.left + this.#offsetX;
    let right = bounds.right + this.#offsetX;
    let belowOutOfBounds = top + this.#height > window.innerHeight;
    let aboveOutOfBounds = (bounds.top - this.#height) < 0;

    if (this.#alwaysBelow) {
      // adjust height to keep on screen
      if (belowOutOfBounds && this.#height > 0) {
        this.style.maxHeight = `${this.#height - ((top + this.#height) - window.innerHeight)}px`;
      }

      top = `${top + this.#offsetY}px`;
    // shift above
    } else if (belowOutOfBounds && !aboveOutOfBounds) {
      bottom = `${window.innerHeight - bounds.top + this.#offsetY}px`;
      top = 'unset';

    // shift up and overlay
    } else if (belowOutOfBounds && this.#overlay) {
      top -= (top + this.#height) - (window.innerHeight);
      top = `${top}px`;

    // keep below
    } else {
      top = `${top + this.#offsetY}px`;
    }

    this.#dialog.style.top = top;
    this.#dialog.style.bottom = bottom;
    if (this.#anchorRight) this.#dialog.style.left = `${right}px`;
    else this.#dialog.style.left = `${left}px`;
  }

  #handleEsc(event) {
    if (event.key === 'Escape') {
      if (this.#allowClose) this.close();
      else event.preventDefault();
    }
  }

  async #handleClose() {
    this.removeAttribute('open');
    this.#dialog.removeEventListener('cancel', this.#handleCancel_bound);
    this.#dialog.removeEventListener('close', this.#handleClose_bound);
    window.removeEventListener('keydown', this.#handleEsc_bound);
    window.removeEventListener('click', this.#clickOutsideClose_bound);
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
    const shouldClose = !ignore && event.target !== this && !this.contains(event.target);
    if (shouldClose) {
      window.removeEventListener('click', this.#clickOutsideClose_bound);
      this.close();
    }
  }

  #scroll() {
    this.#setAnchorPosition();
  }
}
customElements.define(MCSurfaceElement.tag, MCSurfaceElement);
