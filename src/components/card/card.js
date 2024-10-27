import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './card.css' assert { type: 'css' };
import '../state-layer/index.js';
import device from '../../helpers/device.js';
import util from '../../helpers/util.js';
import {
  expand_more_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../helpers/svgs.js';

import Drag from '../../helpers/Drag.js';
import Swipe from '../../helpers/Swipe.js';


export default class MCCardElement extends HTMLComponentElement {
  static tag = 'mc-card';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #abort;
  #fullscreen;
  #hasExpanded;
  #drag;
  #swipe;
  #swipeActionElement;
  #dragging = false;
  #slotChange_bound = this.#slotChange.bind(this);
  #expandedClick_bound = this.#expandedClick.bind(this);
  #clickOutside_bound = this.#clickOutside.bind(this);
  #keydown_bound = this.#keydown.bind(this);
  #fullscreenClick_bound = this.#fullscreenClick.bind(this);
  #fullscreenCloseClick_bound = this.#fullscreenCloseClick.bind(this);
  #dragState_bound = this.#dragState.bind(this);
  #swipeMove_bound = this.#swipeMove.bind(this);
  #swipeEnd_bound = this.#swipeEnd.bind(this);
  #swipeActionClick_bound = this.#swipeActionClick.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);


  constructor() {
    super();

    this.render();
    this.#swipeActionElement = this.shadowRoot.querySelector('[name="swipe-action"]');
    if (this.hasAttribute('onclick')) {
      this.tabIndex = 0;
      this.classList.add('actionable');
    }

    if (this.parentElement.nodeName === 'MC-CARD-GROUP') this.classList.add('grouped');
  }

  template() {
    return /*html*/`
      <slot name="swipe-action"></slot>
      <div class="container">
        <mc-icon-button filled class="fullscreen-close" aria-label="fullscreen-close">
          <mc-icon>${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</mc-icon>
        </mc-icon-button>
        <slot name="image"></slot>
        <div class="content">
          <div style="height: 0; position: relative">
            <div class="expand-arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</div>
          </div>
          <slot name="headline"></slot>
          <slot name="subhead"></slot>
          <slot name="supporting-text"></slot>
          <slot name="expanded"></slot>
          <slot class="default-slot"></slot>
          <slot name="action"></slot>
        </div>
        <mc-state-layer ripple="false" enabled="false" class="temp"></mc-state-layer>
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['fullscreen', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    if (this.#dragging) return;

    this.#abort = new AbortController();
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });
    this.#windowStateChange();

    if (this.classList.contains('actionable')) {
      const stateLayer = this.shadowRoot.querySelector('mc-state-layer');
      stateLayer.enabled = true;
      if (this.hasAttribute('onclick')) stateLayer.ripple = true;
    }

    if (this.parentElement.reorder) {
      this.setAttribute('draggable', 'true');
      this.#drag = new Drag(this);
      this.#drag.listOrderElement = this.parentElement;
      this.#drag.enable();
      this.addEventListener('dragstart', this.#dragState_bound, { signal: this.#abort.signal });
      this.addEventListener('dragend', this.#dragState_bound, { signal: this.#abort.signal });
    }
  }

  disconnectedCallback() {
    if (this.#dragging) return;
    if (this.#abort) this.#abort.abort();
    if (this.#drag) this.#drag.destroy();
  }

  get fullscreen() { return this.#fullscreen; }
  set fullscreen(value) {
    this.#fullscreen = !!value;
    if (this.#fullscreen) this.addEventListener('click', this.#fullscreenClick_bound);
    else this.removeEventListener('click', this.#fullscreenClick_bound);
  }

  get height() {
    return this.shadowRoot.querySelector('.container').offsetHeight;
  }

  


  #slotChange(event) {
    const name = event.target.getAttribute('name');
    if (!this.#fullscreen && name === 'expanded') {
      const hasExpanded = event.target.assignedElements().length > 0;
      this.#hasExpanded = hasExpanded;
      this.shadowRoot.querySelector('.expand-arrow').classList.toggle('show', hasExpanded);
      this.classList.toggle('expanding', hasExpanded);

      event.target.classList.toggle('has-content', hasExpanded);
      if (event.target.assignedElements().length > 0) {
        this.addEventListener('click', this.#expandedClick_bound, { signal: this.#abort.signal });
      } else {
        this.removeEventListener('click', this.#expandedClick_bound);
      }
    } else if (name === 'supporting-text') {
      const hasContent = event.target.assignedElements().length > 0;
      event.target.classList.toggle('has-content', hasContent);
    } else if (name === 'image') {
      const hasContent = event.target.assignedElements().length > 0;
      this.classList.toggle('has-image', hasContent);
      this.#getImageSize();
    } else if (name === 'swipe-action') {
      const hasSwipeAction = event.target.assignedElements().length > 0;
      event.target.classList.toggle('has-swipe-action', hasSwipeAction);

      if (hasSwipeAction) {
        this.#swipe = new Swipe(this, { horizontalOnly: true, disableScroll: true });
        this.#swipe.enable();
        this.addEventListener('swipemove', this.#swipeMove_bound, { signal: this.#abort.signal });
        this.addEventListener('swipeend', this.#swipeEnd_bound, { signal: this.#abort.signal });
        this.#swipeActionElement.addEventListener('click', this.#swipeActionClick_bound, { signal: this.#abort.signal });
      }
    } else if (event.target.classList.contains('default-slot')) {
      event.target.classList.toggle('has-content', event.target.assignedElements().length > 0);
    }
  }
  

  #expandedClick() {
    const isCompact = device.state === 'compact';
    const expanded = this.shadowRoot.querySelector('[name="expanded"]');
    if (!this.hasAttribute('open')) {
      const initialHeight = this.offsetHeight;
      const { clientHeight } = document.documentElement;
      const bounds = expanded.getBoundingClientRect();
      let height = expanded.scrollHeight + 16;
      // max height. scroll 
      if (height > 300) height = 300;

      // do not expand off screen
      if (bounds.top + height > clientHeight - 12) height = clientHeight - bounds.top - 12;

      // prevent offscreen expand from being too small
      if (height < 80) height = 80;

      expanded.style.height = `${height}px`;
      if (!isCompact) this.style.height = `${initialHeight}px`;

      window.addEventListener('keydown', this.#keydown_bound, { signal: this.#abort.signal });
      window.addEventListener('click', this.#clickOutside_bound, { signal: this.#abort.signal });
    } else {
      expanded.style.height = '';
      if (!isCompact) util.transitionendAsync(this).then(() => {
        this.style.height = '';
      });
      window.removeEventListener('keydown', this.#keydown_bound);
      window.removeEventListener('click', this.#clickOutside_bound);
    }

    this.toggleAttribute('open');
  }

  #clickOutside(event) {
    if (!this.contains(event.target)) {
      if (this.#hasExpanded) this.#expandedClick();
    }
  }

  #keydown(event) {
    if (event.code === 'Escape') {
      if (this.#fullscreen) this.#fullscreenCloseClick();
      else if (this.#hasExpanded) this.#expandedClick();
    }
  }

  async #fullscreenCloseClick() {
    window.removeEventListener('keydown', this.#keydown_bound);
    this.shadowRoot.querySelector('.fullscreen-close').removeEventListener('click', this.#fullscreenCloseClick_bound);


    const bounds = this.getBoundingClientRect();
    const container = this.shadowRoot.querySelector('.container');
    container.style.top = `${bounds.top}px`;
    container.style.left = `${bounds.left}px`;
    container.style.width = `${bounds.width}px`;
    container.style.height = `${bounds.height}px`;

    this.classList.add('fullscreen-closing');
    await util.transitionendAsync(container);

    container.style.top = '';
    container.style.left = '';
    container.style.width = '';
    container.style.height = '';
    this.classList.remove('fullscreen-closing');
    this.removeAttribute('open');
  }

  #fullscreenClick() {
    if (this.hasAttribute('open')) return;

    const maxHeight = Math.min(this.querySelector('img').offsetHeight, 300);
    this.style.setProperty('--mc-card-fullscreen-img-height-max', `${maxHeight}px`);
    const bounds = this.getBoundingClientRect();
    this.style.height = `${bounds.height}px`;
    this.style.width = `${bounds.width}px`;
    const container = this.shadowRoot.querySelector('.container');
    container.style.top = `${bounds.top}px`;
    container.style.left = `${bounds.left}px`;
    container.style.width = `${bounds.width}px`;
    container.style.height = `${bounds.height}px`;

    this.setAttribute('open', '');

    requestAnimationFrame(() => {
      container.style.top = '0px';
      container.style.left = '0px';
      container.style.width = '100%';
      container.style.height = '100%';
    });

    this.shadowRoot.querySelector('.fullscreen-close').addEventListener('click', this.#fullscreenCloseClick_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#keydown_bound, { signal: this.#abort.signal });
  }

  #dragState(event) {
    this.#dragging = event.type === 'dragstart';
  }

  #swipeMove(event) {
    let position = event.distanceX;
    if (position > 60) position = 60;
    if (position < 0) position = 0;
    if (position > 0 && !this.classList.contains('swipe-action-showing')) this.classList.add('swipe-action-showing');
    this.style.setProperty('--mc-card-swipe-action-position', `${position}px`);
  }

  #swipeEnd(event) {
    const position = parseInt(getComputedStyle(this).getPropertyValue('--mc-card-swipe-action-position').replace('px', ''));
    this.classList.toggle('swipe-action-showing', position !== 0);
    if (event.swipe) {
      if (event.direction === 'right') this.style.setProperty('--mc-card-swipe-action-position', `60px`);
      else this.style.setProperty('--mc-card-swipe-action-position', `0px`);
    } else if (position < 30) this.style.setProperty('--mc-card-swipe-action-position', `0px`);
    else this.style.setProperty('--mc-card-swipe-action-position', `60px`);
  }

  #swipeActionClick() {
    if (this.querySelector('[slot="swipe-action"][toggle]')) {
      if (this.#swipeActionElement.hasAttribute('checked')) this.#swipeActionElement.removeAttribute('checked');
      else this.#swipeActionElement.setAttribute('checked', '');
    }

    const action = this.#swipeActionElement.getAttribute('action');
    const actionRemove = this.#swipeActionElement.hasAttribute('action-remove');
    if (action) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          action,
          // value: this.#value,
          card: this,
          ...(actionRemove && { remove: true })
        }
      }));
    }

    if (actionRemove) this.remove();

    setTimeout(() => {
      this.style.setProperty('--mc-card-swipe-action-position', `0px`);

      setTimeout(() => {
        this.classList.remove('swipe-action-showing');
      }, 150);
    }, 240);
  }

  #windowStateChange() {
    this.classList.toggle('window-compact', device.state === device.COMPACT);
  }

  #getImageSize() {
    const img = this.querySelector('img');
    if (!img.complete) {
      img.onload = () => this.#getImageSize();
      return;
    }
    const height = img.height;
    const width = img.width;
    const aspectRatio = height / width;
    const adjustedHeight = this.offsetWidth * aspectRatio;
    const minHeight = Math.min(120, adjustedHeight);
    this.style.setProperty('--mc-card-fullscreen-img-height-min', `${minHeight}px`);
    requestAnimationFrame(() => {
      this.shadowRoot.querySelector('[name=image]').classList.add('animate');
    });
  }
}

customElements.define(MCCardElement.tag, MCCardElement);
