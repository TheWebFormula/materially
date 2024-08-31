import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css';

// TODO enhance animation (progress based on pull, trigger bounce when time hit)

class MCPullToRefreshElement extends HTMLComponentElement {
  static tag = 'mc-pull-to-refresh';
  static useShadowRoot = true;
  // static useTemplate = true;
  static styleSheets = [styles];

  #touchStartPos;
  #thresholdScrollStart;
  #distanceThreshold = 80;
  #timeThreshold = 500;
  #thresholdTimeStart;
  #shouldRefresh = false;
  #touchStart_bound = this.#touchStart.bind(this);
  #touchMove_bound = this.#touchMove.bind(this);
  #touchEnd_bound = this.#touchEnd.bind(this);

  constructor() {
    super();
    this.render();
  }

  static get observedAttributesExtended() {
    return [
      ['onrefresh', 'event']
    ];
  }

  template() {
    return /* html */`
      <mc-progress-circular indeterminate></mc-progress-circular>
    `;
  }

  connectedCallback() {
    window.addEventListener('touchstart', this.#touchStart_bound);
    window.addEventListener('touchmove', this.#touchMove_bound);
    window.addEventListener('touchend', this.#touchEnd_bound);
  }

  disconnectedCallback() {
    window.removeEventListener('touchstart', this.#touchStart_bound);
    window.removeEventListener('touchmove', this.#touchMove_bound);
    window.removeEventListener('touchend', this.#touchEnd_bound);
  }

  #touchStart(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.#touchStartPos = event.touches[0].clientY;
  }

  #touchMove(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (this.#shouldRefresh) {
      if (event.passive === false) event.preventDefault();
      return;
    }

    const touchY = event.touches[0].clientY;
    const touchDiff = touchY - this.#touchStartPos;
    if (document.documentElement.scrollTop === 0 && touchDiff > 0) {
      if (this.#thresholdScrollStart === undefined) this.#thresholdScrollStart = touchY;
      if (touchY - this.#thresholdScrollStart > this.#distanceThreshold) {
        this.#thresholdTimeStart = Date.now();
        this.#shouldRefresh = true;
        this.classList.add('show');
      }
    }
  }

  

  #touchEnd(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (this.#shouldRefresh && (Date.now() - this.#thresholdTimeStart) > this.#timeThreshold) {
      this.dispatchEvent(new CustomEvent('refresh'));
      this.classList.remove('show');
    }
    this.#thresholdTimeStart = undefined;
    this.#thresholdScrollStart = undefined;
    this.#shouldRefresh = false;
  }
}
customElements.define(MCPullToRefreshElement.tag, MCPullToRefreshElement);
