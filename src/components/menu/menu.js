import MCSurfaceElement from '../surface/index.js';
import surfaceStyles from '../surface/component.css' assert { type: 'css' };
import styles from './menu.css' assert { type: 'css' };
import util from '../../helpers/util.js'

// TODO figure out aria role. Seems using dialog is problematic
export default class MCMenuElement extends MCSurfaceElement {
  static tag = 'mc-menu';
  static styleSheets = [surfaceStyles, styles];

  #abort;
  #parentMenu;
  #contextMenu;
  #disableLetterFocus;
  #searchItems;
  #searchKeys = '';
  #openKeydown_bound = this.#openKeydown.bind(this);
  #click_bound = this.#click.bind(this);
  #textSearchOver_debounced = util.debounce(this.#textSearchOver, 240);
  #rightClick_bound = this.#rightClick.bind(this);
  #anchorFocus_bound = this.#anchorFocus.bind(this);
  #anchorClick_bound = this.#anchorClick.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);


  constructor() {
    super();

    this.allowClose = true;
    this.noScrim = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#abort = new AbortController();
    this.#contextMenu = this.getAttribute('context-menu');

    if (this.#contextMenu) {
      document.addEventListener('contextmenu', this.#rightClick_bound, { signal: this.#abort.signal });
    } else if (this.hasAttribute('anchor-parent')) {
      this.anchor = this.parentElement;
    } else if (this.hasAttribute('anchor')) {
      this.anchor = document.querySelector(`#${this.getAttribute('anchor')}`);
    }

    this.#initAnchor();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
  }

  get anchor() { return super.anchor; }
  set anchor(value) {
    super.anchor = value;
    if (this.isConnected) setTimeout(() => this.#initAnchor());
  }

  get disableLetterFocus() { return this.#disableLetterFocus; }
  set disableLetterFocus(value) {
    this.#disableLetterFocus = !!value;
  }

  #initAnchor() {
    if (!this.anchor) return;
    if (this.anchor.nodeName === 'MC-MENU-ITEM') {
      this.anchor.nesting = true;
      this.offsetY = -48;
      this.anchorRight = true;
    }
    
    this.anchor.addEventListener('focusin', this.#anchorFocus_bound, { signal: this.#abort.signal });
    this.anchor.addEventListener('click', this.#anchorClick_bound, { signal: this.#abort.signal });
  }

  showModal() {
    super.showModal();
  }

  show() {
    super.show();

    this.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    this.addEventListener('click', this.#click_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#openKeydown_bound, { signal: this.#abort.signal });
  }

  #handleClose() {
    this.removeEventListener('close', this.#handleClose_bound);
    this.removeEventListener('click', this.#click_bound);
    window.removeEventListener('keydown', this.#openKeydown_bound);
  }


  #anchorFocus(event) {
    let host = this.getRootNode().host;
    if (host && (host.nodeName === 'MC-SELECT' || host.nodeName === 'MC-SEARCH')) {
      // dialogs will focus back on the input after close. We want to prevent this so the dialog does not re open
      if (this.open) {
        event.preventDefault();
        return;
      }
      this.show();
    }
  }

  #anchorClick(event) {
    if (!this.open && document.activeElement === this.anchor || event.composedPath()[0] == this.anchor) this.show();
  }


  #click(event) {
    if (event.target.nesting || event.target === this || event.target.nodeName === 'MC-CHIP') return;

    this.close();
    if (this.#parentMenu) setTimeout(() => this.#parentMenu.close(), 120);
  }

  #openKeydown(e) {
    if (e.key === 'Enter' || e.keyCode === 32) {
      if (e.target.nodeName === 'MC-MENU-ITEM' || e.target.nodeName === 'MC-OPTION' || e.target.nodeName === 'MC-SEARCH-OPTION') e.target.shadowRoot.querySelector('mc-state-layer').triggerRipple();
    } else if (e.code === 'ArrowDown') {
      let parent = this;
      if (this.querySelector('slot')) parent = this.getRootNode().host;
      const next = util.getNextFocusableElement(parent, false, this.#acceptFilter);
      if (next) next.focus();
      e.preventDefault();
    } else if (e.code === 'ArrowUp') {
      let parent = this;
      if (this.querySelector('slot')) parent = this.getRootNode().host;
      const next = util.getNextFocusableElement(parent, true, this.#acceptFilter);
      if (next) next.focus();
      e.preventDefault();
    } else if (!this.#disableLetterFocus && ![38, 40, 13].includes(e.keyCode)) return this.#textSearch(e.key);
  }

  #acceptFilter(element) {
    return element.nodeName === 'MC-MENU-ITEM' || element.nodeName === 'MC-OPTION' || element.nodeName === 'MC-SEARCH-OPTION';
  }

  #textSearch(key) {
    this.#searchKeys += key.toLowerCase();
    if (!this.#searchItems) this.#searchItems = this.#getFocusableElement().map(element => ({
      element,
      text: util.getTextFromNode(element).toLowerCase()
    }));

    const match = this.#searchItems.find(({ text }) => text.startsWith(this.#searchKeys));
    if (match) match.element.focus();
    this.#textSearchOver_debounced();
  }

  #textSearchOver() {
    this.#searchKeys = '';
    this.#searchItems = undefined;
  }

  #getFocusableElement() {
    return [...this.querySelectorAll('mc-menu-item'), ...this.querySelectorAll('mc-option'), ...this.querySelectorAll('mc-search-option')];
  }

  #rightClick(event) {
    if (!this.#iscontextMenuParent(event.target)) {
      this.close();
      return;
    }

    this.anchor = event.target;
    if (!this.open) this.show();
    event.preventDefault();
  }

  #iscontextMenuParent(node) {
    let parentElement = node
    while (parentElement !== null && parentElement !== document.body) {
      if (parentElement.getAttribute('context-menu') === this.#contextMenu) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }
}
customElements.define(MCMenuElement.tag, MCMenuElement);
