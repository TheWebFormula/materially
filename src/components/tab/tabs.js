import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './tabs.css' assert { type: 'css' };

class MCTabsElement extends HTMLComponentElement {
  static tag = 'mc-tabs';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [styles];


  #onClick_bound = this.#onClick.bind(this);

  constructor() {
    super();

    this.role = 'tablist';
    this.render();
  }

  template() {
    return /*html*/`
      <slot></slot>
      <div class="indicator"></div>
    `;
  }


  get active() {
    const active = this.querySelector('mc-tab.active') || this.querySelector('mc-tab');
    return active && active.getAttribute('panel');
  }
  set active(value) {
    this.#updateActive(document.querySelector(`#${value}`));
  }

  connectedCallback() {
    this.addEventListener('click', this.#onClick_bound);
    const active = this.querySelector('mc-tab.active');
    if (!active) {
      const first = this.querySelector('mc-tab');
      if (first) first.classList.add('active');
    }

    requestAnimationFrame(() => {
      this.#updateActive(this.querySelector('mc-tab.active') || this.querySelector('mc-tab'));
    });
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick_bound);
  }

  #onClick(event) {
    if (event.target.nodeName !== 'MC-TAB') return;
    this.#updateActive(event.target);
  }

  #updateActive(tab) {
    if (!(tab instanceof HTMLElement)) return;

    const current = this.querySelector('mc-tab.active');
    const hasCurrent = current && current !== tab;
    if (hasCurrent) {
      current.classList.remove('active');
      if (current.panel) current.panel.hidden = true;
    }

    tab.classList.add('active');
    if (tab.panel) tab.panel.hidden = false;

    if (hasCurrent && current.panel && tab.panel) {
      let currentIndex;
      let nextIndex;
      [...this.querySelectorAll('mc-tab')].forEach((tabItem, i) => {
        if (tabItem === current) currentIndex = i;
        if (tabItem === tab) nextIndex = i;
      });

      if (currentIndex > nextIndex) {
        current.panel.style.setProperty('--mc-tab-panel-from-x', '0%');
        current.panel.style.setProperty('--mc-tab-panel-to-x', '100%');
        tab.panel.style.setProperty('--mc-tab-panel-from-x', '-100%');
        tab.panel.style.setProperty('--mc-tab-panel-to-x', '0%');
      } else {
        current.panel.style.setProperty('--mc-tab-panel-from-x', '0%');
        current.panel.style.setProperty('--mc-tab-panel-to-x', '-100%');
        tab.panel.style.setProperty('--mc-tab-panel-from-x', '100%');
        tab.panel.style.setProperty('--mc-tab-panel-to-x', '0%');
      }
    }

    this.#updateIndicator();
  }

  #updateIndicator() {
    const active = this.querySelector('mc-tab.active');
    const internalBounds = active.internalPosition;
    const indicator = this.shadowRoot.querySelector('.indicator');
    const bounds = this.getBoundingClientRect();
    const left = internalBounds.left - bounds.left;
    const right = bounds.right - internalBounds.right;
    indicator.classList.toggle('left', left < parseInt(indicator.style.left || 0));
    indicator.style.left = `${left}px`;
    indicator.style.right = `${right}px`;
  }
}
customElements.define(MCTabsElement.tag, MCTabsElement);
