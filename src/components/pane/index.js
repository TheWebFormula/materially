import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../helpers/device.js';
import util from '../../helpers/util.js';


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
  #collapsiblePane2 = false;
  #memory = [];
  #pointerUp_bound = this.#pointerUp.bind(this);
  #pointerDown_bound = this.#pointerDown.bind(this);
  #pointerMove_bound = this.#pointerMove.bind(this);
  #resizeObserver;
  #windowStateChange_bound = this.#windowStateChange.bind(this);
  #storeMemory_debounced = util.debounce(this.#storeMemory.bind(this), 200);


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

    if (document.querySelector('mc-top-app-bar')) this.classList.add('top-app-bar-exists');

    this.#collapsiblePane2 = this.#pane2?.hasAttribute('collapsible');
  }

  template() {
    return /*html*/`
      <slot></slot>
      <div class="resize-handle"></div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['resize', 'boolean'],
      ['remember', 'boolean'],
      ['default-percent', 'int']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    // window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound);

    if (this.resize) {
      // for simplicity we are subtracking 80px for bottom app bar
      const top = (((window.innerHeight - 80) - this.offsetTop) / 2) - 28;
      this.#resizeHandle.style.top = `${top}px`;
    }
  }

  get resize() {
    return this.hasAttribute('resize');
  }
  set resize(value) {
    this.toggleAttribute('resize', !!value);
    if (!!value && this.#pane2) {
      this.#resizeHandle.addEventListener('pointerdown', this.#pointerDown_bound);
      this.#resizeObserver = new ResizeObserver(() => {
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

  get remember() {
    return this.hasAttribute('remember');
  }
  set remember(value) {
    if (!!value) this.#retrieveMemory();
  }

  get hasMemory() {
    if (!this.remember) return false;
    return !!localStorage.getItem('mc_pane_memory');
  }

  get defaultPercent() {
    return this.getAttribute('resize');
  }
  set defaultPercent(value) {
    if (!value || this.hasMemory) return;

    const one = parseInt(value);
    const two = 100 - one;
    this.#pane1.style.flexBasis = `${one * 100}%`;
    if (this.#pane2) this.#pane2.style.flexBasis = `${two * 100}%`;
  }

  resetMemory() {
    this.#pane1.style.flexBasis = '';
    if (this.#pane2) this.#pane2.style.flexBasis = '';
    this.#storeMemory();
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

    if (this.#collapsiblePane2) {
      this.#pane2.style.minWidth = 0;

      if (this.#pane2.offsetWidth <= 32) {
        this.#pane2.style.flexBasis = '0%';
        this.#pane1.style.flexBasis = '100%';
        this.#pane2.style.padding = 0;
      }
    }

    this.#resizeHandle.style.left = `${this.#pane1.offsetWidth + 12}px`;
    this.#storeMemory_debounced();
  }

  #windowStateChange({ detail }) {
    this.classList.toggle('window-compact', detail.state === device.COMPACT);
  }

  #retrieveMemory() {
    this.#memory = JSON.parse(localStorage.getItem('mc_pane_memory') || '[]');
    this.#memory.forEach(v => {
      if (v.id === '1') this.#pane1.style.flexBasis = v.flexBasis;
      else if (this.#pane2 && v.id === '2') this.#pane2.style.flexBasis = v.flexBasis;
    });
  }

  #storeMemory() {
    let pane1Memory = this.#memory.find(v => v.id === '1');
    if (!pane1Memory) {
      pane1Memory = { id: '1' };
      this.#memory.push(pane1Memory);
    }
    pane1Memory.flexBasis = this.#pane1.style.flexBasis;

    if (this.#pane2) {
      let pane2Memory = this.#memory.find(v => v.id === '2');
      if (!pane2Memory) {
        pane2Memory = { id: '2' };
        this.#memory.push(pane2Memory);
      }
      pane2Memory.flexBasis = this.#pane2.style.flexBasis;
    }

    localStorage.setItem('mc_pane_memory', JSON.stringify(this.#memory));
    window.dispatchEvent(new CustomEvent('mcpaneresived', { detail: structuredClone(this.#memory) }));
  }
}

customElements.define(MCPaneContainerElement.tag, MCPaneContainerElement);
