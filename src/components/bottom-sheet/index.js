import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import Swipe from '../../helpers/Swipe.js';
import util from '../../helpers/util.js';


// TODO predictive back

export default class MCBottomSheetElement extends HTMLComponentElement {
  static tag = 'mc-bottom-sheet';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #abort;
  #swipe;
  #open = false;
  #fixedHeight = false;
  #fixedHeightBottom;
  #initialDragPosition;
  #lastScrollPosition;
  #isScrolling = false;
  #surface;
  #surfaceContainer;
  #swipeStart_bound = this.#swipeStart.bind(this);
  #swipeEnd_bound = this.#swipeEnd.bind(this);
  #swipeMove_bound = this.#swipeMove.bind(this);
  #onScroll_bound = util.rafThrottle(this.#onScroll.bind(this));


  constructor() {
    super();
  
    this.render();
    this.#surface = this.shadowRoot.querySelector('.surface');
    this.#surfaceContainer = this.shadowRoot.querySelector('.surface-container');
  }

  template() {
    return /*html*/`
      <div class="surface">
        <div class="surface-container">
          <div class="surface-content">
            <div class="handle"></div>
            <slot class="default-slot"></slot>
          </div>
        </div>
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['open', 'boolean'],
      ['fixed-height', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = !!value;
    this.classList.toggle('open', this.#open);
  }

  get fixedHeight() { return this.#fixedHeight; }
  set fixedHeight(value) {
    this.#fixedHeight = value;
    if (this.#fixedHeight) this.#setFixedHeight();
    else this.#position = this.#initialPosition;
  }


  get #initialPosition() {
    if (this.#fixedHeight) return this.#fixedHeightBottom;
    const initialPositionVar = parseInt(this.#surface.style.getPropertyValue('--mc-bottom-sheet-initial-position') || 40) / 100;
    return -(this.#surface.offsetHeight - (window.innerHeight * initialPositionVar));
  }

  get #topPosition() {
    return -(this.#surface.offsetHeight - window.innerHeight);
  }

  get #minimizedPosition() {
    const offset = document.body.classList.contains('has-bottom-app-bar') || document.body.classList.contains('has-navigation-bar') ? 80 : 0;
    return -(this.#surface.offsetHeight - 80 - offset);
  }

  get #position() {
    return parseInt(this.#surface.style.getPropertyValue('--mc-bottom-sheet-bottom').replace('px', ''));
  }
  set #position(value) {
    this.#surface.style.setProperty('--mc-bottom-sheet-bottom', `${value}px`);
  }


  connectedCallback() {
    if (document.body.classList.contains('has-bottom-app-bar')) this.classList.add('has-bottom-app-bar');
    if (document.body.classList.contains('has-navigation-bar')) this.classList.add('has-navigation-bar');
    if (device.state === device.COMPACT) this.classList.add('window-compact');

    this.#abort = new AbortController();

    if (!this.#fixedHeight) {
      this.#swipe = new Swipe(this.#surface, { verticalOnly: true, disableScroll: true });
      this.#swipe.enable();
      this.#surface.addEventListener('swipestart', this.#swipeStart_bound, { signal: this.#abort.signal });
      this.#surface.addEventListener('swipemove', this.#swipeMove_bound, { signal: this.#abort.signal });
      this.#surface.addEventListener('swipeend', this.#swipeEnd_bound, { signal: this.#abort.signal });
    }

    // TODO figure why this is needed if page containing is initial load vs spa navigated to
    setTimeout(() => {
      this.#position = this.#initialPosition;
    }, 10);

    // this.addEventListener('predictive-back', this.#onPredictiveBack_bound);
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#swipe) this.#swipe.destroy();
  }


  #toTopPosition() {
    this.#position = this.#topPosition;
    this.#switchToScrolling();
  }

  #switchToScrolling(movementY) {
    this.#surfaceContainer.style.overflowY = 'scroll';
    this.#position = 0;
    this.#isScrolling = true;
    this.#swipe.disableScroll = false;
    if (movementY) this.#surfaceContainer.scrollTop = -movementY;
    this.#surfaceContainer.addEventListener('scroll', this.#onScroll_bound);
    this.classList.add('fullscreen');
  }

  #switchToDragging() {
    this.#surfaceContainer.removeEventListener('scroll', this.#onScroll_bound);
    this.#initialDragPosition = 0;
    this.#position = 0;
    this.classList.remove('fullscreen');
    this.#surfaceContainer.style.overflowY = 'visible';
    this.#surfaceContainer.style.height = '';
    this.#isScrolling = false;
    this.#swipe.disableScroll = true;
  }

  #setFixedHeight() {
    const contentBounds = this.#surface.querySelector('.item-padding').getBoundingClientRect();
    this.#surface.style.height = `${contentBounds.height}px`;
    this.#position = 0;
    this.#fixedHeightBottom = 0;
  }


  #swipeStart() {
    if (this.#isScrolling) return;
    this.#initialDragPosition = this.#position;
  }

  #swipeMove(event) {
    if (this.#surfaceContainer.scrollTop <= 0 && event.directionY === 1 && this.#surfaceContainer.style.overflowY !== 'visible') {
      this.#switchToDragging();
      return;
    }

    if (this.#isScrolling) return;

    // container has been drag to top and needs to be converted to scroll
    if (this.#position >= this.#topPosition && event.directionY === -1) {
      this.#switchToScrolling(event.deltaDistanceY);
      return;
    }

    this.#position = this.#initialDragPosition - event.distanceY;
  }

  async #swipeEnd(event) {
    if (this.#isScrolling) return;

    this.#surface.classList.add('animate-position');

    if (event.directionY === -1) {
      if (this.#position > this.#initialPosition) this.#toTopPosition();
      else this.#position = this.#initialPosition;
    } else {
      if (this.#position >= this.#initialPosition) this.#position = this.#initialPosition;
      else this.#position = this.#minimizedPosition;
    }

    await util.transitionendAsync(this.#surface);
    this.#surface.classList.remove('animate-position');
  }

  // wait for overscroll to settle then switch back to drag
  #onScroll() {
    if (this.#surfaceContainer.scrollTop <= 0 && this.#surfaceContainer.scrollTop === this.#lastScrollPosition) {
      this.#switchToDragging();
    }
    this.#lastScrollPosition = this.#surfaceContainer.scrollTop
  }
}

customElements.define(MCBottomSheetElement.tag, MCBottomSheetElement);
