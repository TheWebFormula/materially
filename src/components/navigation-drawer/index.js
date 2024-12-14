import MCSideSheetElement from '../side-sheet/index.js';
import sideSheetStyles from '../side-sheet/component.css';
import styles from './component.css' assert { type: 'css' };
import stylesAnchor from '../anchor/anchor-drawer.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import util from '../../helpers/util.js';
import '../anchor/index.js';


class MCNavigationDrawerElement extends MCSideSheetElement {
  static tag = 'mc-navigation-drawer';
  static styleSheets = [sideSheetStyles, styles, stylesAnchor];


  #locationchange_bound = this.#locationchange.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #click_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);



  constructor() {
    super();

    device.hasNavigationDrawer = true;

    this.role = 'navigation';
    this.alignLeft = true;
    this.scrim = true;
    this.allowClose = true;
    this.hideClose = true;
    this.#locationchange();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('locationchange', this.#locationchange_bound);
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound);
    this.addEventListener('focusin', this.#focus_bound);
    this.addEventListener('click', this.#click_bound);
  }


  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const current = this.querySelector('.current');
    if (current) {
      current.classList.remove('current');
      if (current.parentElement.nodeName === 'MC-ANCHOR-GROUP') {
        current.parentElement.open = false;
        current.parentElement.classList.remove('has-current');
      }
    }
    const match = this.querySelector(`[href="${path}"]`) || this.querySelector(`[href="${path.split('#')[0]}"]`);
    if (match) {
      match.classList.add('current');
      if (match.parentElement.nodeName === 'MC-ANCHOR-GROUP') {
        match.parentElement.open = true;
        match.parentElement.classList.add('has-current');
      }
    }

    if (this.modal && this.open) setTimeout(() => this.open = false, 100);
  }

  #windowStateChange({ detail }) {
    switch (detail.state) {
      case device.EXPANDED:
        this.open = true;

        requestAnimationFrame(() => {
          const current = this.querySelector('.current');
          if (current) {
            let bounds = current.offsetTop - this.offsetHeight + 56;
            if (bounds > 0) {
              let scrollContainer = this.shadowRoot.querySelector('.surface-content');
              scrollContainer.scrollTop = current.offsetTop - (this.offsetHeight / 2) + 28;
            }
          }
        });
        break;
      case device.MEDIUM:
        this.open = !device.hasNavigationRail;
        break;
      case device.COMPACT:
        this.open = false;
        break;
    }
  }


  #click(event) {
    if (event.target.nodeName === 'A') {
      event.target.classList.add('animate');
      requestAnimationFrame(() => {
        event.target.classList.remove('animate');
        event.target.blur();
      });
    }
  }


  #focus(event) {
    if (event.target.parentElement.nodeName === 'MC-ANCHOR-GROUP' && !event.target.parentElement.open) event.target.parentElement.open = true;
    this.addEventListener('blur', this.#blur_bound);
    this.addEventListener('keydown', this.#focusKeydown_bound);
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.code === 'Tab') {
      const pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
      const firstFocusablePageContent = util.getNextFocusableElement(pageContent, false);
      if (firstFocusablePageContent) firstFocusablePageContent.focus();
      e.preventDefault();
    } if (e.code === 'Enter' || e.code === 'Space') {
      e.target.click();
      e.target.blur();
      e.preventDefault();
    } else if (e.code === 'ArrowDown') {
      const parent = e.target.parentElement.nodeName === 'MC-ANCHOR-GROUP' ? e.target.parentElement.parentElement : e.target.parentElement;
      const next = util.getNextFocusableElement(parent, false, this.#acceptFilter);
      if (next) next.focus();
      e.preventDefault();
    } else if (e.code === 'ArrowUp') {
      const parent = e.target.parentElement.nodeName === 'MC-ANCHOR-GROUP' ? e.target.parentElement.parentElement : e.target.parentElement;
      const next = util.getNextFocusableElement(parent, true, this.#acceptFilter);
      if (next) next.focus();
      e.preventDefault();
    }
  }

  #acceptFilter(element) {
    return element.nodeName === 'A' && !element.hasAttribute('control');
  }
}

customElements.define(MCNavigationDrawerElement.tag, MCNavigationDrawerElement);
