import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };


export default class MCSnackbarElement extends HTMLComponentElement {
  static tag = 'mc-snackbar';
  static styleSheets = [styles];
  static useShadowRoot = false;
  static useTemplate = false;


  constructor() {
    super();

    this.role = 'alertdialog';
    this.setAttribute('popover', 'manual');
  }
}
customElements.define(MCSnackbarElement.tag, MCSnackbarElement);
