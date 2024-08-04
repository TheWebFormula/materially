import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import util from '../../helpers/util.js';


class MCNavigationBarElement extends HTMLComponentElement {
  static tag = 'mc-navigation-bar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #autoHide;
  #hide = false;
  #scrollTop = 0;
  #movement = 0;
  #direction = 1;
  #stateCallbacks = [];
  #scroll_bound = this.#scroll.bind(this);
  #locationchange_bound = this.#locationchange.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #click_bound = this.#click.bind(this);


  constructor() {
    super();

    if (device.state === device.COMPACT) this.classList.add('window-compact');

    this.role = 'navigation';
    this.render();
    this.#autoHide = this.hasAttribute('auto-hide');
    document.body.classList.add('has-navigation-bar');
    if (this.#autoHide) document.body.classList.add('navigation-bar-auto-hide');
    this.#locationchange();
  }

  template() {
    return /*html*/`
        <slot></slot>
    `;
  }

  connectedCallback() {
    this.#abort =  new AbortController();
    window.addEventListener('locationchange', this.#locationchange_bound, { signal: this.#abort.signal });
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });
    if (this.#autoHide) document.addEventListener('scroll', this.#scroll_bound, { signal: this.#abort.signal });
    [...this.querySelectorAll('a')].forEach(anchor => {
      if (!util.getTextFromNode(anchor)) anchor.classList.add('no-text');
    });
    this.addEventListener('click', this.#click_bound);
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    this.#stateCallbacks.length = 0;
  }

  get hide() {
    return this.#hide;
  }
  set hide(value) {
    this.#hide = !!value;
    this.classList.toggle('hide', !!value);

    const hidden = this.#autoHide ? device.state !== device.COMPACT || this.#hide : this.#hide;
    this.#stateCallbacks.forEach(cb => cb(hidden));
  }


  onState(callback) {
    this.#stateCallbacks.push(callback);
    const hidden = this.#autoHide ? device.state !== device.COMPACT || this.#hide : this.#hide;
    callback(hidden);
  }

  offState(callback) {
    const index = this.#stateCallbacks.indexOf(callback);
    if (index === -1) return;
    this.#stateCallbacks.splice(index, 1);
  }

  #scroll() {
    const currentScrollTop = document.documentElement.scrollTop;
    const distance = currentScrollTop - this.#scrollTop;
    if (distance === 0) return;

    const direction = distance >= 1 ? 1 : -1;
    if (direction !== this.#direction) this.#movement = 0;
    this.#scrollTop = currentScrollTop;
    this.#direction = direction;
    this.#movement += distance;
    if (this.hide && this.#movement < -30) this.hide = false;
    if (!this.hide && this.#movement > 30) this.hide = true;
  }

  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const current = this.querySelector('.current');
    if (current) current.classList.remove('current');
    const match = this.querySelector(`[href="${path}"]`);

    if (match) {
      match.classList.add('current');

      // if (device.animationReady) {
      //   match.classList.add('animate');
      //   requestAnimationFrame(() => {
      //     match.classList.remove('animate');
      //   });
      // }
    }
  }

  #windowStateChange({ detail }) {
    const compact = detail.state === device.COMPACT;
    this.classList.toggle('window-compact', compact);
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
customElements.define(MCNavigationBarElement.tag, MCNavigationBarElement);
