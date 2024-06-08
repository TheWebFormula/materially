import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };


class MCIconElement extends HTMLComponentElement {
  static tag = 'mc-icon';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  constructor() {
    super();
    this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }
}
customElements.define(MCIconElement.tag, MCIconElement);
