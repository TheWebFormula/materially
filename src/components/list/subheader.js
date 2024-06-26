import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './subheader.css' assert { type: 'css' };


const overflowScrollRegex = /(auto|scroll)/
const observers = new WeakMap();

class MCListSubheaderElement extends HTMLComponentElement {
  static tag = 'mc-list-subheader';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #observer;

  constructor() {
    super();

    this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }

  connectedCallback() {
    this.#setupObserver();
    setTimeout(() => this.classList.add('animation'), 150);
  }

  disconnectedCallback() {
    if (this.#observer) this.#observer.unobserve(this);
  }


  #setupObserver() {
    const list = this.closest('mc-list');
    if (!observers.get(list)) {
      setTimeout(() => {
        const newObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            entry.target.classList.toggle('stuck', entry.isIntersecting);
          });
        }, { root: list, rootMargin: `0px 0px -${Math.max(list.offsetHeight - 56, 0)}px 0px` });
        observers.set(list, newObserver);
      }, 100);
    }

    setTimeout(() => {
      this.#observer = observers.get(list);
      this.#observer.observe(this);
    }, 101);
  }
}
customElements.define(MCListSubheaderElement.tag, MCListSubheaderElement);
