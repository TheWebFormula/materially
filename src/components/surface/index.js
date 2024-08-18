import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';

// TODO make fullscreen start from anchor

export default class MCSurfaceElement extends HTMLComponentElement {
  static tag = 'mc-surface';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #anchor;
  #modal = false;
  #height;
  #fullscreen;
  #offsetY = 0;
  #offsetX = 0;
  #anchorRight = false;
  #overlay = true;
  #alwaysBelow = false;
  #removeOnClose = false;
  #closeIgnoreElements = [];
  #toggle_bound = this.#toggle.bind(this);


  constructor() {
    super();

    this.popover = 'auto';
    this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }

  static get observedAttributesExtended() {
    return [
      ['anchor', 'string'],
      ['modal', 'string'],
      ['prevent-close', 'boolean'],
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
    this.addEventListener('toggle', this.#toggle_bound, { signal: this.#abort.signal });
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
    this.classList.toggle('anchor', !!this.#anchor);

    if (this.#anchor) {
      let id = this.getAttribute('id') || `surface_${parseInt(Math.random() * 999)}`;
      if (!this.hasAttribute('id')) this.setAttribute('id', id);

      let anchorId = this.#anchor.getAttribute('id') || `anchor_${id}`;
      if (!this.#anchor.hasAttribute('id')) this.#anchor.setAttribute('id', anchorId);

      // this.#anchor.setAttribute('popovertarget', id);
      this.#anchor.popoverTargetElement = this;
      this.setAttribute('aria-labelledby', anchorId);
      this.#anchor.ariaHasPopup = true;
      this.#anchor.setAttribute('aria-controls', id);
    }
  }

  get modal() { return this.#modal; }
  set modal(value) {
    this.#modal = !!value;
    this.classList.toggle('modal', this.#modal);
  }

  get preventClose() { return this.popover === 'manual'; }
  set preventClose(value) {
    this.popover = !!value ? 'manual' : 'auto';
  }

  get removeOnClose() { return this.#removeOnClose; }
  set removeOnClose(value) { this.#removeOnClose = !!value; }

  get fullscreen() { return this.#fullscreen; }
  set fullscreen(value) { this.#fullscreen = !!value; }

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


  setPosition() {
    if (this.modal) this.#setModalPosition();
    else this.#setAnchorPosition();
  }

  #toggle(event) {
    if (event.newState === 'open') {
      this.onShow();
    } else {
      this.onHide();
    }
  }

  onShow() {
    // get height and set css var for animation and positioning
    this.style.setProperty('--mc-surface-height', '0');
    this.#height = this.offsetHeight;
    this.style.setProperty('--mc-surface-height', `${this.#height}px`);
    this.setPosition();
  }

  onHide() {
    if (this.removeOnClose) {
      util.animationendAsync(this).then(() => {
        this.parentElement.removeChild(this);
     });
    }
  }

  #setModalPosition() {
    this.style.top = '';
    this.style.bottom = '';
    this.style.left = '';
  }
  
  #setAnchorPosition() {
    if (!this.#anchor || this.#fullscreen) return;

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

      top = `${top + document.documentElement.scrollTop + this.#offsetY}px`;
    // shift above
    } else if (belowOutOfBounds && !aboveOutOfBounds) {
      bottom = `${window.innerHeight - bounds.top - document.documentElement.scrollTop + this.#offsetY}px`;
      top = 'unset';

    // shift up and overlay
    } else if (belowOutOfBounds && this.#overlay) {
      top -= (top - document.documentElement.scrollTop + this.#height) - (window.innerHeight);
      top = `${top}px`;

    // keep below
    } else {
      top = `${top + document.documentElement.scrollTop  + this.#offsetY}px`;
    }

    this.style.top = top;
    this.style.bottom = bottom;
    if (this.#anchorRight) this.style.left = `${right}px`;
    else this.style.left = `${left}px`;
  }
}
customElements.define(MCSurfaceElement.tag, MCSurfaceElement);
