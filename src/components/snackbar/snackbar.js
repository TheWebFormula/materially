import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import mcSwipe from '../../helpers/swipe.js';

// TODO css variables
// TODO tab indexing. Web components buttons seem not to work by default with popover

export default class MCSnackbarElement extends HTMLComponentElement {
  static tag = 'mc-snackbar';
  static styleSheets = [styles];
  static useShadowRoot = false;
  static useTemplate = false;

  #navigationBar;
  #swipe;
  #navigationBarState_bound = this.#navigationBarState.bind(this);
  #onSwipe_bound = this.#onSwipe.bind(this);

  constructor() {
    super();

    this.role = 'alertdialog';
    this.setAttribute('popover', 'manual');
  }

  connectedCallback() {
    this.#navigationBar = document.querySelector('mc-navigation-bar');
    if (this.#navigationBar) this.#navigationBar.onState(this.#navigationBarState_bound);

    this.#swipe = new mcSwipe(this);
    this.#swipe.enable();
    this.addEventListener('swipe', this.#onSwipe_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('swipe', this.#onSwipe_bound);
    if (this.#navigationBar) this.#navigationBar.offState(this.#navigationBarState_bound);
    this.#swipe.destroy();
  }

  #navigationBarState(hidden) {
    this.classList.toggle('navigation-bar-show', !hidden);
  }

  #onSwipe() {
    this.hidePopover();
  }
}
customElements.define(MCSnackbarElement.tag, MCSnackbarElement);
