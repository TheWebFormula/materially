import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };

// Wait for icon font to load
// document.fonts.ready.then(event => {
//   const iconFont = [...event].find(v => v.family.contains('Material Symbols'));
//   if (iconFont) document.querySelector('html').classList.add('wfc-material-icon-font-loaded');
// });

class WFCIconElement extends HTMLComponentElement {
  static tag = 'wfc-icon';
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
customElements.define(WFCIconElement.tag, WFCIconElement);

// https://fonts.google.com/icons?icon.style=Outlined&icon=
