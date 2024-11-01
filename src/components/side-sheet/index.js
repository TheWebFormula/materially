import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import Swipe from '../../helpers/Swipe.js';
import util from '../../helpers/util.js';
import {
  close_FILL0_wght400_GRAD0_opsz24,
  arrow_back_FILL1_wght300_GRAD0_opsz24,
  arrow_back_ios_20dp_E8EAED_FILL0_wght700_GRAD200_opsz20
} from '../../helpers/svgs.js';


export default class MCSideSheetElement extends HTMLComponentElement {
  static tag = 'mc-side-sheet';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #open = false;
  #openSet = false;
  #modalSet = false;
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #close_bound = this.close.bind(this);
  #redispatchBack_bound = this.#redispatchBack.bind(this);
  #formSubmit_bound = this.#formSubmit.bind(this);

  #initiated = false;
  #predictiveBackDisable = false;
  #surface;
  #swipe;
  #swipeCloseIconAuto;
  #predictiveBackIcon;

  #swipeCloseStart_bound = this.#swipeCloseStart.bind(this);
  #swipeCloseMove_bound = this.#swipeCloseMove.bind(this);
  #swipeCloseEnd_bound = this.#swipeCloseEnd.bind(this);
  #preventBack_bound = this.#preventBack.bind(this);

  constructor() {
    super();

    // if modal or open is added initially we want to prevent automatic changing based on window size
    this.#openSet = this.hasAttribute('open');
    this.#modalSet = this.hasAttribute('modal');
    this.#windowStateChange({ detail: device });
    this.render();
    this.#surface = this.shadowRoot.querySelector('.surface');
    this.#predictiveBackIcon = this.shadowRoot.querySelector('.predictive-back-icon');
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="surface">
        <div class="surface-content">
          <slot name="header"></slot>
          <div class="header">
            <mc-icon-button class="back" aria-label="back">
              <mc-icon>${arrow_back_FILL1_wght300_GRAD0_opsz24}</mc-icon>
            </mc-icon-button>
            <slot name="headline"></slot>
            <mc-icon-button class="close" aria-label="close">
              <mc-icon>${close_FILL0_wght400_GRAD0_opsz24}</mc-icon>
            </mc-icon-button>
          </div>
          <slot class="default-slot"></slot>
          <div class="actions">
            <mc-divider></mc-divider>
            <slot name="action"></div>
          </div>

          <div class="predictive-back-icon right hide">${arrow_back_ios_20dp_E8EAED_FILL0_wght700_GRAD200_opsz20}</div>
        </div>
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['open', 'boolean'],
      ['align-left', 'boolean'],
      ['modal', 'boolean'],
      ['scrim', 'boolean'],
      ['prevent-close', 'boolean'],
      ['inset', 'boolean'],
      ['hide-close', 'boolean'],
      ['back', 'boolean'],
      ['onback', 'event'],
      ['predictive-back-disable', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    if (!this.hideClose) this.shadowRoot.querySelector('.close').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    if (this.back) this.shadowRoot.querySelector('.back').addEventListener('click', this.#redispatchBack_bound, { signal: this.#abort.signal });
    if (!this.preventClose && this.scrim) {
      this.shadowRoot.querySelector('.scrim').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    }
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });

    let form = this.querySelector('form[method=dialog]');
    if (form) {
      form.addEventListener('submit', this.#formSubmit_bound, { signal: this.#abort.signal });

      let cancelButton = this.querySelector('mc-button[form][type=cancel]');
      if (cancelButton) cancelButton.addEventListener('cancel', this.#close_bound, { signal: this.#abort.signal });
    }

    const allowPredictiveBack = !this.#predictiveBackDisable && device.state === device.COMPACT;
    if (allowPredictiveBack) {
      this.#swipe = new Swipe(this.#surface, { horizontalOnly: true });
      this.#surface.addEventListener('swipestart', this.#swipeCloseStart_bound, { signal: this.#abort.signal });
      this.#surface.addEventListener('swipeend', this.#swipeCloseEnd_bound, { signal: this.#abort.signal });
      this.#surface.addEventListener('swipemove', this.#swipeCloseMove_bound, { signal: this.#abort.signal });
    }

    this.#initiated = true;
    this.#handleOpen();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#swipe) this.#swipe.destroy();
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    const changed = this.#open !== !!value;
    this.#open = !!value;
    this.classList.toggle('open', this.#open);
    if (this.#initiated && changed) {
      this.#handleOpen();
      this.dispatchEvent(new CustomEvent('change'));
    }
  }

  get modal() {
    return this.hasAttribute('modal');
  }
  set modal(value) {
    this.toggleAttribute('modal', !!value);
  }

  get alignLeft() {
    return this.hasAttribute('align-left');
  }
  set alignLeft(value) {
    this.toggleAttribute('align-left', !!value);
  }

  get scrim() { return this.hasAttribute('scrim'); }
  set scrim(value) {
    this.toggleAttribute('scrim', !!value);
  }

  get preventClose() { return this.hasAttribute('prevent-close'); }
  set preventClose(value) {
    this.toggleAttribute('prevent-close', !!value);
  }

  get inset() { return this.hasAttribute('inset'); }
  set inset(value) {
    this.toggleAttribute('inset', !!value);
  }

  get hideClose() { return this.hasAttribute('hide-close'); }
  set hideClose(value) {
    this.toggleAttribute('hide-close', !!value);
  }

  get back() { return this.hasAttribute('back'); }
  set back(value) {
    this.toggleAttribute('back', !!value);
  }

  get swipeCloseIconAuto() { return this.#swipeCloseIconAuto; }
  set swipeCloseIconAuto(value) {
    this.#swipeCloseIconAuto = !!value;
  }

  get predictiveBackDisable() {
    return this.#predictiveBackDisable;
  }
  set predictiveBackDisable(value) {
    this.#predictiveBackDisable = !!value;
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  #handleOpen() {
    const allowPredictiveBack = !this.#predictiveBackDisable && device.state === device.COMPACT;
    if (this.open) {
      if (allowPredictiveBack) {
        this.#swipe.enable();
        // only applies to left side of screen
        if (this.hasAttribute('align-left')) document.addEventListener('touchstart', this.#preventBack_bound, { passive: false, signal: this.#abort.signal });
      }
    } else {
      if (allowPredictiveBack) {
        if (this.#swipe) this.#swipe.disable();
        document.removeEventListener('touchstart', this.#preventBack_bound);
      }
    }
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  #windowStateChange({ detail }) {
    const state = detail.state;
    if (!this.#modalSet) this.modal = state === device.COMPACT;
    if (!this.#openSet) this.open = state !== device.COMPACT;
  }

  #redispatchBack() {
    this.dispatchEvent(new CustomEvent('back'));
  }

  #formSubmit(event) {
    this.close();
  }


  #swipeCloseStart(event) {
    const bounds = this.getBoundingClientRect();
    const isLeft = this.hasAttribute('align-left');
    const distance = isLeft ? event.clientX - bounds.left : bounds.right - event.clientX;
    if (distance > 20) {
      event.preventDefault();
    }
  }

  #swipeCloseMove({ distanceX, directionX }) {
    const multiplier = 0.2;
    const eased = util.easeScale(Math.abs(distanceX), 20) * multiplier;
    const percent = (Math.min(1, (eased / 20)) * 0.08);
    const scale = 1 - percent;
    const x = percent * -200 * directionX;
    this.#surface.style.transform = `translateX(${x}px) scale(${scale})`;

    if (this.#swipeCloseIconAuto && directionX === 1) {
      this.#predictiveBackIcon.classList.remove('right');
      this.#predictiveBackIcon.classList.add('left');
    } else if (this.#swipeCloseIconAuto) {
      this.#predictiveBackIcon.classList.remove('left');
      this.#predictiveBackIcon.classList.add('right');
    }

    if (this.#predictiveBackIcon && Math.abs(distanceX) > 20) {
      this.#predictiveBackIcon.classList.remove('hide');
      const percent = Math.min(1, (eased / 20));
      const stretch = Math.min(25, Math.floor(percent * 40));
      this.#predictiveBackIcon.style.setProperty('--mc-predictive-back-stretch', `${stretch}px`);
    } else {
      this.#predictiveBackIcon.classList.add('hide');
    }
  }

  #swipeCloseEnd({ distanceX }) {
    this.#surface.style.transform = '';
    this.#predictiveBackIcon.classList.add('hide');
    if (Math.abs(distanceX) > 22) {
      this.close();
      this.dispatchEvent(new Event('predictive-back'));
    }
  }

  // prevent swipe back on mobile devices
  #preventBack(event) {
    if (event.pageX < 20) {
      event.preventDefault();
      return false;
    }
  }
}

customElements.define(MCSideSheetElement.tag, MCSideSheetElement);
