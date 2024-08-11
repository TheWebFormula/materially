import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import util from '../../helpers/util.js';
import '../anchor/index.js';

class MCNavigationRailElement extends HTMLComponentElement {
  static tag = 'mc-navigation-rail';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #locationchange_bound = this.#locationchange.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #click_bound = this.#click.bind(this);


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
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound);
    [...this.querySelectorAll('a')].forEach(anchor => {
      if (!util.getTextFromNode(anchor)) anchor.classList.add('no-text');
    });
    this.addEventListener('click', this.#click_bound);
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
      // if (match.parentElement.nodeName === 'MC-ANCHOR-GROUP') {
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

  #click(event) {
    if (event.target.nodeName === 'A') {
      event.target.classList.add('animate');
      requestAnimationFrame(() => {
        event.target.classList.remove('animate');
        event.target.blur();
      });
    }
  }
}
customElements.define(MCNavigationRailElement.tag, MCNavigationRailElement);
