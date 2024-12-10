import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list.css' assert { type: 'css' };
import util from '../../helpers/util.js';


class MCListElement extends HTMLComponentElement {
  static tag = 'mc-list';
  static useShadowRoot = false;
  static useTemplate = false;
  static styleSheets = [styles];

  #virtualTemplate;
  #itemHeight = 56;
  #isVirtual = false;
  #virtualList = [];
  #blocks = [];
  #pool = [];
  #scroll_bound = util.rafThrottle(this.#scroll.bind(this));
  // #onChange_bound = this.#onChange.bind(this);


  constructor() {
    super();

    this.role = 'list';
    // this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }
  
  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['reorder', 'boolean'],
      ['swap', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() {
    return [...this.querySelectorAll('mc-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'))
      .join(',');
  }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('mc-list-item')]
      .forEach(item => item.selected = valueArray.includes(item.value));
  }

  get swap() { return this.hasAttribute('swap'); }
  set swap(value) {
    setTimeout(() => {
      [...this.querySelectorAll('mc-list-item')].map((element, i) => {
        element.swap = value;
      });
    });
  }

  get virtualTemplate() {
    return this.#virtualTemplate;
  }
  set virtualTemplate(value) {
    this.#virtualTemplate = value;
  }

  set virtualList(value) {
    this.#virtualList = value;
    if (Array.isArray(value)) this.#setupVirtual();
    else this.#cleanupVirtualRepeat();
  }

  disconnectedCallback() {
    if (this.#virtualList) this.#cleanupVirtualRepeat();
  }

  #setupVirtual() {
    if (this.#isVirtual) return;

    this.#isVirtual = true;
    
    // get item height
    const template = document.createElement('template');
    template.innerHTML = this.#virtualTemplate(this.#virtualList[0] || {});
    const element = template.content.firstElementChild;
    element.style.visible = 'hidden';
    this.append(element);
    this.#itemHeight = element.offsetHeight;
    this.removeChild(element);

    window.addEventListener('scroll', this.#scroll_bound);
    this.#updateVirtual();
  }

  #cleanupVirtualRepeat() {
    if (!this.#isVirtual) return;

    window.removeEventListener('scroll', this.#scroll_bound);
    this.#virtualTemplate = undefined;
    this.#virtualList = [];
    this.#blocks = [];
    this.#pool = [];
  }

  #scroll() {
    this.#updateVirtual();
  }

  #getBlock(i) {
    const block = this.#blocks.find(b => b.index === i);
    if (block) return block;
    if (this.#pool.length) {
      const poolBlock = this.#pool.pop();
      this.#blocks.push(poolBlock);
      return poolBlock;
    }

    const newBlock = {
      index: -1,
      template: document.createElement('template'),
      element: undefined
    };
    this.#blocks.push(newBlock);
    return newBlock;
  }

  #poolBlocks(count, offset) {
    const indexArray = [...new Array(count)].map((_, i) => i + offset);
    this.#blocks = this.#blocks.filter(b => {
      if (indexArray.includes(b.index)) return true;
      b.index = -1;
      this.#pool.push(b);
      this.removeChild(b.element);
      return false;
    });
  }

  #updateBlock(block, dataIndex) {
    if (block.index === dataIndex) return;
    block.index = dataIndex;
    block.template.innerHTML = this.#virtualTemplate(this.#virtualList[dataIndex]);
    block.element = block.template.content.cloneNode(true).firstElementChild;
  }

  #appendBlocks() {
    this.#blocks.sort((a, b) => a.index - b.index);
    const firstConnected = this.#blocks.findIndex(b => b.element.isConnected);
    for (let i = 0; i < this.#blocks.length; i += 1) {
      const block = this.#blocks[i];
      if (block.element.isConnected) continue;

      if (firstConnected === -1) this.appendChild(block.element);
      else if (i < firstConnected) this.#blocks[firstConnected].element.insertAdjacentElement('beforebegin', block.element);
      else this.insertAdjacentElement('beforeend', block.element);
    }
  }

  #updateVirtual() {
    const itemHeight = this.#itemHeight;
    const bounds = this.getBoundingClientRect();
    const totalHeight = this.#virtualList.length * itemHeight;
    const bottom = bounds.top + totalHeight;
    const visibleTop = bounds.top < 0 ? 0 : bounds.top;
    const visibleHeight = Math.max(0, Math.min(window.innerHeight, bottom) - visibleTop);
    const aboveHeight = bounds.top < 0 ? Math.abs(bounds.top) : 0;
    const belowHeight = totalHeight - aboveHeight - visibleHeight;
    const aboveOffset = aboveHeight % itemHeight;
    const adjustedAboveHeight = aboveHeight - aboveOffset;
    const adjustedVisibleHeight = visibleHeight + aboveOffset;
    const aboveItemCount = adjustedAboveHeight / itemHeight;
    const remainingCount = this.#virtualList.length - aboveItemCount;
    const visibleHeightCount = Math.ceil(adjustedVisibleHeight / itemHeight) + 4;
    const itemCount = Math.max(0, Math.min(remainingCount, visibleHeightCount));
    if (itemCount === 0) return;

    this.#poolBlocks(itemCount, aboveItemCount);

    for (let i = 0; i < itemCount; i += 1) {
      const block = this.#getBlock(i + aboveItemCount);
      this.#updateBlock(block, i + aboveItemCount);
    }

    this.#appendBlocks();


    this.style.paddingTop = `${adjustedAboveHeight}px`;
    this.style.paddingBottom = `${belowHeight}px`;
  }

  // connectedCallback() {
  //   this.addEventListener('change', this.#onChange_bound);
  // }

  // disconnectedCallback() {
  //   this.removeEventListener('change', this.#onChange_bound);
  // }


  // #onChange(event) {
  //   if (!this.#multiple && event.target.selected) {
  //     [...this.querySelectorAll('mc-list-item')].forEach(e => {
  //       if (e === event.target) return;
  //       if (e.selected) e.selected = false;
  //     });
  //   }
  //   if (event.detail !== 'longpress' || this.#isSelectionMode) {
  //     if (this.values.length === 0) this.exitSelectionMode();
  //     return;
  //   }
  //   this.#isSelectionMode = true;
  //   [...this.querySelectorAll('mc-list-item')].forEach(e => e.selectionMode = true);
  //   this.dispatchEvent(new Event('enter-selection-mode', { bubbles: true }));
  // }
}
customElements.define(MCListElement.tag, MCListElement);
