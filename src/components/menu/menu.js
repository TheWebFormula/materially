import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './menu.css' assert { type: 'css' };
import util from '../../helpers/util.js'

// const popoverSupported = HTMLElement.prototype.hasOwnProperty('popover');


export default class MCMenuElement extends HTMLComponentElement {
  static tag = 'mc-menu';
  static styleSheets = [styles];
  static useShadowRoot = false;
  static useTemplate = false;

  #abort;
  #anchor;
  #overlay;
  #parentMenu;
  #contextMenu;
  #disableLetterFocus;
  #searchItems;
  #searchKeys = '';
  #offsetY;
  #toggle_bound = this.#toggle.bind(this);
  #openKeydown_bound = this.#openKeydown.bind(this);
  #click_bound = this.#click.bind(this);
  #textSearchOver_debounced = util.debounce(this.#textSearchOver, 240);
  #rightClick_bound = this.#rightClick.bind(this);
  #preventContextMenuClose_bound = this.#preventContextMenuClose.bind(this);
  #scroll_bound = this.#scroll.bind(this);


  constructor() {
    super();

    this.role = 'menu';
    this.setAttribute('popover', '');
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.#contextMenu = this.getAttribute('context-menu');
    this.#offsetY = parseInt(this.getAttribute('offset-y') || 0);

    if (this.#contextMenu) {
      document.addEventListener('contextmenu', this.#rightClick_bound, { signal: this.#abort.signal });
    } else {
      this.anchor = document.querySelector(`#${this.getAttribute('anchor')}`);
    }

    this.addEventListener('toggle', this.#toggle_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }


  get anchor() { return this.#anchor; }
  set anchor(value) {
    this.#anchor = value instanceof HTMLElement ? value : document.querySelector(`#${value}`);
    if (this.#anchor) {
      this.#anchor.popoverTargetElement = this;
      this.#anchor.popoverTargetAction = 'toggle';
      const anchorParent = this.#anchor.parentElement;
      this.#parentMenu = anchorParent.nodeName === 'MC-MENU' ? anchorParent : undefined;
      this.#overlay = this.#parentMenu || this.hasAttribute('overlay');
    }
  }


  #toggle(event) {
    if (event.newState === 'open') {
      this.#setAnchorPosition();
      this.addEventListener('click', this.#click_bound, { signal: this.#abort.signal });
      window.addEventListener('keydown', this.#openKeydown_bound, { signal: this.#abort.signal });
      window.addEventListener('scroll', this.#scroll_bound, { signal: this.#abort.signal });
    } else {
      this.removeEventListener('click', this.#click_bound);
      window.removeEventListener('keydown', this.#openKeydown_bound);
      window.removeEventListener('scroll', this.#scroll_bound);
    }
  }

  #click(event) {
    if (event.target.popoverTargetElement) return;
    setTimeout(() => {
      this.hidePopover();
      if (this.#parentMenu) setTimeout(() => this.#parentMenu.hidePopover(), 120);
      // this.#anchor.blur();
    });
  }

  #setAnchorPosition() {
    const bounds = this.#anchor.getBoundingClientRect();
    let block = this.#overlay ? bounds.top : bounds.bottom + 8;
    let left = this.#parentMenu ? bounds.right : bounds.left;
    let height = this.scrollHeight;

    // handle out of bounds bottom of screen
    if (block + height > window.innerHeight) {
      block = this.#overlay ? window.innerHeight - bounds.bottom : window.innerHeight - bounds.top + 8;
      this.style.bottom = `${block + this.#offsetY}px`;
      this.style.top = 'unset';
    } else {
      this.style.top = `${block + this.#offsetY}px`;
      this.style.bottom = 'unset';
    }

    this.style.left = `${left}px`;
    this.style.setProperty('--mc-surface-height', `${height}px`);
  }

  #openKeydown(e) {
    if (e.key === 'Enter' || e.keyCode === 32) {
      if (e.target.nodeName === 'MC-MENU-ITEM' || e.target.nodeName === 'MC-OPTION') e.target.shadowRoot.querySelector('mc-state-layer').triggerRipple();
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
    return element.nodeName === 'MC-MENU-ITEM' || element.nodeName === 'MC-OPTION';
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
    return [...this.querySelectorAll('mc-menu-item'), ...this.querySelectorAll('mc-option')];
  }

  #rightClick(event) {
    if (!this.#iscontextMenuParent(event.target)) {
      this.hidePopover();
      return;
    }

    this.#anchor = event.target;
    event.preventDefault();

    // prevent popover from auto closing. The other option is to set popover=manual, but that remove default functionality for click and esc
    document.addEventListener('pointerup', this.#preventContextMenuClose_bound);
  }

  #iscontextMenuParent(node) {
    let parentElement = node
    while (parentElement !== null && parentElement !== document.body) {
      if (parentElement.getAttribute('context-menu') === this.#contextMenu) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }

  #preventContextMenuClose(event) {
    this.togglePopover();
    event.preventDefault();
    document.removeEventListener('pointerup', this.#preventContextMenuClose_bound);
  }

  #scroll() {
    this.#setAnchorPosition();
  }
}
customElements.define(MCMenuElement.tag, MCMenuElement);
