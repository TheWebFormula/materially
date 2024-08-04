import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';

// TODO save pane width on resize

export default class MCPaneContainerElement extends HTMLComponentElement {
  static tag = 'mc-pane-container';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #resizeHandle;
  #pane1;
  #pane2;
  #initialPageX;
  #initialWidth;
  #pointerUp_bound = this.#pointerUp.bind(this);
  #pointerDown_bound = this.#pointerDown.bind(this);
  #pointerMove_bound = this.#pointerMove.bind(this);
  #resizeObserver;
  #windowStateChange_bound = this.#windowStateChange.bind(this);


  constructor() {
    super();

    if (this.hasAttribute('scroll')) document.body.classList.add('pane-layout');
    this.render();
    this.#resizeHandle = this.shadowRoot.querySelector('.resize-handle');
    const panes = this.querySelectorAll('mc-pane');
    this.#pane1 = panes[0];
    this.#pane2 = panes[1];
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound);
    if (panes.length > 2 && this.resize) console.warn('mc-pane-container only supports resizing for 2 mc-pane elements');
  }

  template() {
    return /*html*/`
      <slot></slot>
      <div class="resize-handle"></div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['resize', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    // window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound);
  }

  get resize() {
    return this.hasAttribute('resize');
  }
  set resize(value) {
    this.toggleAttribute('resize', !!value);
    if (!!value && this.#pane2) {
      this.#resizeHandle.addEventListener('pointerdown', this.#pointerDown_bound);
      this.#resizeObserver = new ResizeObserver((entries) => {
        this.#resize();
      });
      this.#resizeObserver.observe(this.#pane2);
    } else {
      if (this.#resizeObserver) {
        this.#resizeObserver.disconnect();
        this.#resizeObserver = undefined;
      }
      this.classList.remove('show-resize-handle');
      this.#resizeHandle.removeEventListener('pointerdown', this.#pointerUp_bound);
      window.removeEventListener('pointerup', this.#pointerDown_bound);
      window.removeEventListener('pointermove', this.#pointerMove_bound);
    }
  }

  #resize() {
    this.#resizeHandle.style.left = `${this.#pane1.offsetWidth + 12}px`;
  }

  #pointerDown(event) {
    this.#initialPageX = event.pageX;
    this.#initialWidth = this.#pane1.offsetWidth;
    window.addEventListener('pointerup', this.#pointerUp_bound);
    window.addEventListener('pointermove', this.#pointerMove_bound);
  }

  #pointerUp() {
    window.removeEventListener('pointerup', this.#pointerUp_bound);
    window.removeEventListener('pointermove', this.#pointerMove_bound);
  }

  #pointerMove(event) {
    let width = this.#initialWidth + (event.pageX - this.#initialPageX);
    const one = width / (this.offsetWidth - 54);
    const two = 1 - one;
    this.#pane1.style.flexBasis = `${one * 100}%`;
    this.#pane2.style.flexBasis = `${two * 100}%`;

    if (this.#pane2.hasAttribute('collapsible') && this.#pane2.offsetWidth < 64) {
      this.#pane2.style.flexBasis = 0;
    }

    this.#resizeHandle.style.left = `${this.#pane1.offsetWidth + 12}px`;
  }

  #windowStateChange({ detail }) {
    this.classList.toggle('window-compact', detail.state === device.COMPACT);
  }
}

customElements.define(MCPaneContainerElement.tag, MCPaneContainerElement);
