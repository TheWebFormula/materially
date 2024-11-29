import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list-item.css' assert { type: 'css' };
import '../state-layer/index.js';
import '../avatar/index.js';
import util from '../../helpers/util.js';
import Swipe from '../../helpers/Swipe.js';
import Drag from '../../helpers/Drag.js';


class MCListItemElement extends HTMLComponentElement {
  static tag = 'mc-list-item';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #swipe;
  #drag;
  #dragging = false;
  #swap = false;
  #value;
  #states;
  #selected;
  #selectionControl;
  #container;
  #swipeStartElement;
  #swipeEndElement;
  #hasSwipeStart;
  #hasSwipeEnd;
  #actionActiveThreshold = 80;
  #onChange_bound = this.#onChange.bind(this);
  #longPress_bound = this.#longPress.bind(this);
  #swipeMove_bound = this.#swipeMove.bind(this);
  #swipeEnd_bound = this.#swipeEnd.bind(this);
  #dragState_bound = this.#dragState.bind(this);
  #slotchange_bound = this.#slotchange.bind(this);

 
  constructor() {
    super();

    this.role = 'listitem';
    this.render();
    this.#container = this.shadowRoot.querySelector('.container');
    this.#swipeStartElement = this.shadowRoot.querySelector('[name="swipe-start"]');
    this.#swipeEndElement = this.shadowRoot.querySelector('[name="swipe-end"]');
    this.#selectionControl = this.querySelector('mc-checkbox') || this.querySelector('mc-switch') || this.querySelector('mc-avatar[select]');
  }

  template() {
    return /*html*/`
      <slot name="swipe-start"></slot>
      <div class="container">
        <slot name="start"></slot>
        <div class="text">
          <slot name="overline"></slot>
          <slot class="default-slot"></slot>
          <slot name="headline"></slot>
          <slot name="supporting-text"></slot>
        </div>
        <slot name="trailing-supporting-text"></slot>
        <slot name="end"></slot>
        <mc-state-layer ripple="false" enabled="false"></mc-state-layer>
      </div>
      <slot name="swipe-end"></slot>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['selected', 'boolean'],
      ['states', 'boolean'],
      ['ripple', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
  }

  get selected() {
    return this.#selected;
  }
  set selected(value) {
    if (!this.#selectionControl) return;
    this.#selected = !!value;
    // Without this the checked property breaks
    if (this.#selectionControl) requestAnimationFrame(() => this.#selectionControl.checked = this.#selected);
  }

  get states() { return this.#states; }
  set states(value) {
    this.#states = !!value;
    this.shadowRoot.querySelector('mc-state-layer').enabled = !!value;
  }

  get ripple() { return this.shadowRoot.querySelector('mc-state-layer').ripple; }
  set ripple(value) {
    this.shadowRoot.querySelector('mc-state-layer').ripple = !!value;
  }

  get swap() {
    return this.#swap;
  }
  set swap(value) {
    if (this.#drag) this.#drag.swap = !!value;
  }


  connectedCallback() {
    if (this.#dragging) return;

    this.#abort = new AbortController();
    this.#hasSwipeStart = this.querySelector('[slot="swipe-start"]') !== null;
    this.#hasSwipeEnd = this.querySelector('[slot="swipe-end"]') !== null;
    if (this.#hasSwipeStart || this.#hasSwipeEnd) {
      this.#swipe = new Swipe(this, { horizontalOnly: true });
      this.#swipe.enable();
      this.addEventListener('swipemove', this.#swipeMove_bound, { signal: this.#abort.signal });
      this.addEventListener('swipeend', this.#swipeEnd_bound, { signal: this.#abort.signal });
    }

    const list = this.parentElement.nodeName === 'SECTION' ? this.parentElement.parentElement : this.parentElement;
    if (list.reorder) {
      this.setAttribute('draggable', 'true');
      this.#drag = new Drag(this, this.swap);
      this.#drag.listOrderElement = list;
      this.#drag.enable();
      this.addEventListener('dragstart', this.#dragState_bound, { signal: this.#abort.signal });
      this.addEventListener('dragend', this.#dragState_bound, { signal: this.#abort.signal });
    }


    if (this.#selectionControl) {
      if (!list.reorder) util.addLongPressListener(this, this.#longPress_bound);
      this.#selectionControl.addEventListener('change', this.#onChange_bound, { signal: this.#abort.signal });
      if (this.#states === undefined) this.states = true;
    }

    this.shadowRoot.addEventListener('slotchange', this.#slotchange_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#dragging) return;

    if (this.#abort) this.#abort.abort();
    if (this.#swipe) this.#swipe.destroy();
    if (this.#drag) this.#drag.destroy();
    util.removeLongPressListener(this, this.#longPress_bound);
  }

  async remove() {
    this.style.height = `${this.offsetHeight}px`;
    this.classList.add('remove');
    await util.nextAnimationFrameAsync();
    this.style.height = '';
    setTimeout(() => {
      super.remove();
    }, 150)
  }



  #onChange(event) {
    this.#selected = this.#selectionControl.checked;
    if (event.bubbles) event.stopPropagation();
    const copy = Reflect.construct(event.constructor, [event.type, event]);
    const dispatched = this.dispatchEvent(copy);
    if (!dispatched) event.preventDefault();
    return dispatched;
  }

  #longPress() {
    this.#selectionControl.checked = !this.#selectionControl.checked;
    // this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: 'longpress' }));
  }


  #swipeMove(event) {
    let distanceX = event.distanceX;
    if (!this.#hasSwipeStart && distanceX > 0) distanceX = 0;
    if (!this.#hasSwipeEnd && distanceX < 0) distanceX = 0;

    this.#container.style.transform = `translateX(${distanceX}px)`;
    if (distanceX < 0 && !this.#swipeStartElement.classList.contains('hide')) {
      this.#swipeStartElement.classList.add('hide');
      this.#swipeEndElement.classList.remove('hide')
    } else if (distanceX > 0 && !this.#swipeEndElement.classList.contains('hide')) {
      this.#swipeEndElement.classList.add('hide');
      this.#swipeStartElement.classList.remove('hide')
    }

    const pastThreshold = Math.abs(distanceX) > this.#actionActiveThreshold;
    if (distanceX > 0) {
      if (pastThreshold && !this.#swipeStartElement.classList.contains('activate')) this.#swipeStartElement.classList.add('activate');
      else if (!pastThreshold && this.#swipeStartElement.classList.contains('activate')) this.#swipeStartElement.classList.remove('activate');
    } else if (distanceX < 0) {
      if (pastThreshold && !this.#swipeEndElement.classList.contains('activate')) this.#swipeEndElement.classList.add('activate');
      else if (!pastThreshold && this.#swipeEndElement.classList.contains('activate')) this.#swipeEndElement.classList.remove('activate');
    }
  }

  #swipeEnd(event) {
    let pastThreshold = Math.abs(event.distanceX) > this.#actionActiveThreshold;
    if (pastThreshold) {
      if (event.distanceX > 0) {
        this.dispatchEvent(new Event('swipeactionstart', { bubbles: true }));
      } else {
        this.dispatchEvent(new Event('swipeactionend', { bubbles: true }));
      }
    }

    // wait to see if remove is called
    setTimeout(() => {
      if (this.classList.contains('remove')) {
        this.#container.style.transitionDuration = '120ms';
        this.#container.style.transform = event.distanceX > 0 ? 'translateX(100%)' : 'translateX(-100%)';
      } else {
        this.shadowRoot.querySelector('slot[name="swipe-start"]').classList.remove('activate');
        this.shadowRoot.querySelector('slot[name="swipe-end"]').classList.remove('activate');
        this.#container.style.transform = '';
      }
    }, 0);
  }

  #dragState(event) {
    this.#dragging = event.type === 'dragstart';
  }

  #slotchange(event) {
    const slotName = event.target.getAttribute('name');
    if (slotName === 'end' || slotName === 'start') {
      for (const element of event.target.assignedElements()) {
        if (!element.ariaLabel && (element.role === 'checkbox' || element.role === 'switch')) {
          element.ariaLabel = 'selection control';
        }
      }
    }
  }
}
customElements.define(MCListItemElement.tag, MCListItemElement);
