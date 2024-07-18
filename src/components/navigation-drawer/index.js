import MCSideSheetElement from '../side-sheet/index.js';
import sideSheetStyles from '../side-sheet/component.css';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';


// TODO fix top position when on mobile.


class MCNavigationDrawerElement extends MCSideSheetElement {
  static tag = 'mc-navigation-drawer';
  static styleSheets = [sideSheetStyles, styles];


  #locationchange_bound = this.#locationchange.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);


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
        // requestAnimationFrame(() => {
        //   this.querySelector('.current').scrollIntoView({ behavior: 'instant', block: 'center' });
        // });
        break;
      case device.MEDIUM:
        this.open = !device.hasNavigationRail;
        break;
      case device.COMPACT:
        this.open = false;
        break;
    }
  }
}

customElements.define(MCNavigationDrawerElement.tag, MCNavigationDrawerElement);
