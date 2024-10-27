import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';
import Swipe from '../../helpers/Swipe.js';

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
  #bottomSheet = false;
  #swipe;
  #alwaysBelow = false;
  #removeOnClose = false;
  #closeIgnoreElements = [];
  #toggle_bound = this.#toggle.bind(this);
  
  #swipeEnd_bound = this.#swipeEnd.bind(this);
  #swipeMove_bound = this.#swipeMove.bind(this);


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
    if (this.#swipe) {
      this.removeEventListener('swipeend', this.#swipeEnd_bound);
      this.removeEventListener('swipemove', this.#swipeMove_bound);
      this.#swipe.destroy();
    }
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
  set fullscreen(value) {
    this.#fullscreen = !!value;
    this.classList.toggle('fullscreen', this.#fullscreen);
  }

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

  get bottomSheet() { return this.#bottomSheet; }
  set bottomSheet(value) {
    this.#bottomSheet = !!value;
    this.classList.toggle('bottom-sheet', this.#bottomSheet);
    if (this.#bottomSheet) {
      this.#swipe = new Swipe(this, { verticalOnly: true, disableScroll: true });
      this.addEventListener('swipeend', this.#swipeEnd_bound);
      this.addEventListener('swipemove', this.#swipeMove_bound);
    } else if (this.#swipe) {
      this.removeEventListener('swipeend', this.#swipeEnd_bound);
      this.removeEventListener('swipemove', this.#swipeMove_bound);
      this.#swipe.destroy();
      this.#swipe = undefined;
    }
  }



  setPosition() {
    if (this.#bottomSheet) return;
    else if (this.modal) this.#setModalPosition();
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
    if (!this.#height) {
      this.style.setProperty('--mc-surface-height', '0');
      this.#height = this.offsetHeight;
      this.style.setProperty('--mc-surface-height', `${this.#height}px`);
    }
    this.setPosition();
    this.setAttribute('open', '');
    if (this.#swipe) this.#swipe.enable();
  }

  onHide() {
    this.removeAttribute('open');
    if (this.#swipe) this.#swipe.disable();
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

  #swipeMove(event) {
    this.style.bottom = `-${util.overscrollEase(event.distanceY, 65) }px`;
  }

  #swipeEnd(event) {
    if (event.directionY === 1 && event.swipe === true) {
      this.hidePopover();
    } else {
      this.style.bottom = '';
    }
  }
}
customElements.define(MCSurfaceElement.tag, MCSurfaceElement);
