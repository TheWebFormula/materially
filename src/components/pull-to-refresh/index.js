import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css';


class MCPullToRefreshElement extends HTMLComponentElement {
  static tag = 'mc-pull-to-refresh';
  static useShadowRoot = true;
  static styleSheets = [styles];

  #touchStartPos;
  #thresholdScrollStart;
  #distanceThreshold = 80;
  #timeThreshold = 500;
  #thresholdTimeStart;
  #shouldRefresh = false;
  #progress;
  #bounceTimeout;
  #touchStart_bound = this.#touchStart.bind(this);
  #touchMove_bound = this.#touchMove.bind(this);
  #touchEnd_bound = this.#touchEnd.bind(this);

  constructor() {
    super();
    this.render();
    this.#progress = this.shadowRoot.querySelector('mc-progress-circular');
  }

  static get observedAttributesExtended() {
    return [
      ['onrefresh', 'event']
    ];
  }

  template() {
    return /* html */`
      <mc-progress-circular></mc-progress-circular>
    `;
  }

  connectedCallback() {
    window.addEventListener('touchstart', this.#touchStart_bound, { passive: false });
    window.addEventListener('touchmove', this.#touchMove_bound, { passive: false });
    window.addEventListener('touchend', this.#touchEnd_bound, { passive: false });
  }

  disconnectedCallback() {
    window.removeEventListener('touchstart', this.#touchStart_bound);
    window.removeEventListener('touchmove', this.#touchMove_bound);
    window.removeEventListener('touchend', this.#touchEnd_bound);
  }

  resolve() {
    this.classList.remove('show');
    this.classList.remove('wait');
    this.style.transform = '';
  }

  #touchStart(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.#touchStartPos = event.touches[0].clientY;
  }

  #touchMove(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const scrollTop = Math.max(0, document.documentElement.scrollTop);
    const touchY = event.touches[0].clientY;
    const touchDiff = touchY - this.#touchStartPos;
    if (scrollTop === 0) {
      if (!this.classList.contains('show')) {
        this.#progress.indeterminate = false;
        this.#progress.value = 0;
        this.classList.add('show');
        document.documentElement.classList.add('pull-to-refresh-active');
      }
      const position = touchY - this.#touchStartPos;
      const percent = Math.max(0, position) / this.#distanceThreshold;
      const y = 68 - Math.min(68, percent * 68);
      this.style.transform = `translateY(-${y}px)`;
      this.#progress.value = percent;

      document.body.style.marginTop = `${this.#overscrollEase(position)}px`;

      if (touchDiff > 0) {
        event.preventDefault();

        if (this.#thresholdScrollStart === undefined) {
          this.#thresholdScrollStart = touchY;
        }

        if (!this.#shouldRefresh && position > this.#distanceThreshold) {
          this.#thresholdTimeStart = Date.now();
          this.#shouldRefresh = true;
          this.#bounceTimeout = setTimeout(() => {
            this.classList.add('bounce');
          }, this.#timeThreshold);
        }
      }
    }
  }

  #touchEnd(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (this.#shouldRefresh && (Date.now() - this.#thresholdTimeStart) > this.#timeThreshold) {
      this.dispatchEvent(new CustomEvent('refresh'));
      this.classList.add('wait');
      this.#progress.indeterminate = true;
    } else {
      this.classList.remove('show');
      this.style.transform = '';
    }
    if (this.#bounceTimeout) {
      clearTimeout(this.#bounceTimeout);
      this.#bounceTimeout = undefined;
    }
    this.#thresholdTimeStart = undefined;
    this.#thresholdScrollStart = undefined;
    this.#shouldRefresh = false;
    document.body.style.marginTop = '';
    document.documentElement.classList.add('pull-to-refresh-inactive');
    document.documentElement.classList.remove('pull-to-refresh-active');
  }

  #overscrollEase(y) {
    const scale = 45;
    return scale * Math.log(y + scale) - scale * Math.log(scale);
  }
}
customElements.define(MCPullToRefreshElement.tag, MCPullToRefreshElement);
