import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';

class WFCNavigationRailElement extends HTMLComponentElement {
  static tag = 'wfc-navigation-rail';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #locationchange_bound = this.#locationchange.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);


  constructor() {
    super();

    device.hasNavigationRail = true;

    this.role = 'navigation';
    this.render();
    this.#locationchange();
  }

  template() {
    return /*html*/`
      <div class="surface">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    window.addEventListener('locationchange', this.#locationchange_bound);
    window.addEventListener('wfcwindowstatechange', this.#windowStateChange_bound);
  }

  disconnectedCallback() {
    // window.removeEventListener('locationchange', this.#locationchange_bound);
  }


  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const current = this.querySelector('.current');
    if (current) current.classList.remove('current');
    const match = this.querySelector(`[href="${path}"]`);

    if (match) {
      match.classList.add('current');
      // if (match.parentElement.nodeName === 'WFC-ANCHOR-GROUP') {
      //   match.parentElement.classList.add('has-current');
      // }

      if (device.animationReady) {
        match.classList.add('animate');
        requestAnimationFrame(() => {
          match.classList.remove('animate');
        });
      }
    }
  }

  #windowStateChange({ detail }) {
    switch (detail.state) {
      case device.EXPANDED:
      case device.MEDIUM:
        this.classList.remove('hide');
        break;
      case device.COMPACT:
        this.classList.add('hide');
        break;
    }
  }
}
customElements.define(WFCNavigationRailElement.tag, WFCNavigationRailElement);
