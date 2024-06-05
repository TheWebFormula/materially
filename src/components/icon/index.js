import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };

// Wait for icon font to load
// document.fonts.ready.then(event => {
//   const iconFont = [...event].find(v => v.family.contains('Material Symbols'));
//   if (iconFont) document.querySelector('html').classList.add('mc-material-icon-font-loaded');
// });

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

// https://fonts.google.com/icons?icon.style=Outlined&icon=
