import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };


export default class MCTooltipElement extends HTMLComponentElement {
  static tag = 'mc-tooltip';
  static styleSheets = [styles];
  static useShadowRoot = true;
  static useTemplate = true;


  constructor() {
    super();

    this.role = 'tooltip';
    this.ariaLabel = 'none';
    this.render();
  }

  template() {
    return /*html*/`
      <div class="container">
        <slot name="subhead"></slot>
        <slot class="default-slot"></slot>
        <slot name="actions"></slot>
      </div>
    `;
  }

  get height() {
    return this.shadowRoot.querySelector('.container').offsetHeight;
  }
}
customElements.define(MCTooltipElement.tag, MCTooltipElement);
