import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import Ripple from '../../helpers/Ripple.js';
import device from '../../helpers/device.js';

export default class MCStateLayer extends HTMLComponentElement {
  static tag = 'mc-state-layer';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #for;
  #forElement;
  #enabled = true;
  #ripple;
  #rippleEnabled;
  #preventFocus = false;
  #preventfocusnodename;
  #onFocus_bound = this.#onFocus.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #mouseEnter_bound = this.#mouseEnter.bind(this);
  #mouseLeave_bound = this.#mouseLeave.bind(this);
  #pointerDown_bound = this.#pointerDown.bind(this);
  #rippleEnterKey_bound = this.#rippleEnterKey.bind(this);

  constructor() {
    super();
    this.render();

    const rootNode = this.getRootNode();
    this.#forElement = rootNode instanceof ShadowRoot ? rootNode.host : rootNode;
  }

  static get observedAttributesExtended() {
    return [
      ['for', 'string'],
      ['enabled', 'boolean'],
      ['ripple', 'boolean'],
      ['preventfocusnodename', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get for() { return this.#for; }
  set for(value) {
    this.#forElement = this.getRootNode().querySelector(value);
    this.#for = value;
  }

  get ripple() { return this.#rippleEnabled; }
  set ripple(value) {
    this.#rippleEnabled = !!value;
    if (!this.isConnected) return;

    if (this.#rippleEnabled && !this.#ripple) {
      this.#ripple = new Ripple({
        element: this.shadowRoot.querySelector('.ripple'),
        triggerElement: this.#forElement,
        centered: this.hasAttribute('ripple-centered')
      });
    } else if (!this.#rippleEnabled && this.#ripple) {
      this.#ripple.destroy();
      this.#ripple = undefined;
    }
  }

  get enabled() { return this.#enabled; }
  set enabled(value) {
    this.#enabled = !!value;
    if (!this.isConnected) return;

    if (this.#enabled) {
      this.#forElement.addEventListener('focusin', this.#onFocus_bound);
      if (!device.hasTouchScreen) this.#forElement.addEventListener('mouseenter', this.#mouseEnter_bound);
      this.#forElement.addEventListener('pointerdown', this.#pointerDown_bound);
    } else if (!this.#enabled) {
      this.disconnectedCallback();
    }
  }

  get preventfocusnodename() {
    return this.#preventfocusnodename;
  }
  set preventfocusnodename(value) {
    this.#preventfocusnodename = value;
  }

  template() {
    return '<div class="background"></div><div class="ripple"></div>';
  }

  connectedCallback() {
    if (this.#enabled) {
      this.#forElement.addEventListener('focusin', this.#onFocus_bound);
      if (!device.hasTouchScreen) this.#forElement.addEventListener('mouseenter', this.#mouseEnter_bound);
      this.#forElement.addEventListener('pointerdown', this.#pointerDown_bound);

      // recover from an element entering then leaving
      if (this.classList.contains('hover')) {
        this.#forElement.addEventListener('mouseleave', this.#mouseLeave_bound);
      }
    }

    if (this.#rippleEnabled && !this.#ripple) {
      this.#ripple = new Ripple({
        element: this.shadowRoot.querySelector('.ripple'),
        triggerElement: this.#forElement,
        centered: this.hasAttribute('ripple-centered')
      });
      this.#forElement.addEventListener('keydown', this.#rippleEnterKey_bound);
    }

    this.#forElement.hideFocus = () => {
      this.#forElement.removeEventListener('focusout', this.#onBlur_bound);
      this.classList.remove('focus');
    }
  }

  disconnectedCallback() {
    this.#forElement.removeEventListener('focusin', this.#onFocus_bound);
    this.#forElement.removeEventListener('focusout', this.#onBlur_bound);
    this.#forElement.removeEventListener('mouseenter', this.#mouseEnter_bound);
    this.#forElement.removeEventListener('mouseleave', this.#mouseLeave_bound);
    this.#forElement.removeEventListener('pointerdown', this.#pointerDown_bound);
    this.#forElement.removeEventListener('keydown', this.#rippleEnterKey_bound);
    if (this.#ripple) this.#ripple.destroy();
  }

  #onFocus(event) {
    if (this.#preventFocus) {
      this.#preventFocus = false;
      return;
    }
    this.#forElement.addEventListener('focusout', this.#onBlur_bound);

    // implemented to handle dialogs automatically focusing on last element for some components (mc-button from mc-menu-item)
    const relatedTargetNodeName = event.relatedTarget && event.relatedTarget.nodeName;
    if (!relatedTargetNodeName || this.#preventfocusnodename !== relatedTargetNodeName) this.classList.add('focus');
  }

  #onBlur() {
    this.#forElement.removeEventListener('focusout', this.#onBlur_bound);
    this.classList.remove('focus');
  }

  #mouseEnter() {
    this.#forElement.addEventListener('mouseleave', this.#mouseLeave_bound);
    this.classList.add('hover');
  }

  #mouseLeave() {
    this.#forElement.removeEventListener('mouseleave', this.#mouseLeave_bound);
    this.classList.remove('hover');
  }

  // prevent focus on click
  #pointerDown() {
    this.#preventFocus = true;
  }

  #rippleEnterKey(e) {
    if (e.key === 'Enter') this.#ripple.trigger();
  }

  triggerRipple() {
    this.#ripple.trigger();
  }
}

customElements.define(MCStateLayer.tag, MCStateLayer);
