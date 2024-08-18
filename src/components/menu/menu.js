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


  constructor() {
    super();

    this.role = 'menu';
  }

  connectedCallback() {
    super.connectedCallback();

    this.#abort = new AbortController();
    this.#contextMenu = this.getAttribute('context-menu');
    if (this.#contextMenu) {
      document.addEventListener('contextmenu', this.#rightClick_bound, { signal: this.#abort.signal });
    }

    if (this.anchor?.nodeName === 'MC-MENU-ITEM') {
      this.anchor.nesting = true;
      this.offsetY = -48;
      this.anchorRight = true;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#abort) this.#abort.abort();
  }

  onShow() {
    super.onShow();
    let focusItem = this.querySelector('[selected]') || this.querySelector('[tabindex]:not([tabindex="-1"])');
    if (focusItem) focusItem.focus();
    window.addEventListener('keydown', this.#openKeydown_bound, { signal: this.#abort.signal });
    this.addEventListener('click', this.#click_bound, { signal: this.#abort.signal });
  }

  onHide() {
    super.onHide();

    this.removeEventListener('click', this.#click_bound);
    window.removeEventListener('keydown', this.#openKeydown_bound);
  }



  #click(event) {
    if (event.target.nesting || event.target === this || event.target.nodeName === 'MC-CHIP') return;

    this.hidePopover();
    if (this.#parentMenu) setTimeout(() => this.#parentMenu.hidePopover(), 120);
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
      this.hidePopover();
      return;
    }

    this.anchor = event.target;
    this.showPopover();
    event.preventDefault();
    
    // mimic behavior of system right click
    // If right click is held down for more then 400ms the menu auto closes
    // By default the menu will not stay open without calling showPopover again
    let startTime = Date.now();
    this.anchor.addEventListener('pointerup', () => {
      if (Date.now() - startTime < 400) this.showPopover();
    }, { once: true });
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
