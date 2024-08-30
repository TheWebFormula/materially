import HTMLComponentElement from '../HTMLComponentElement.js';
import './time-picker-input.js';
import './time-picker-mobile.js';
import device from '../../helpers/device.js';



class MCTimePickerElement extends HTMLComponentElement {
  static tag = 'mc-time-picker';
  static useTemplate = false;

  #modal;
  #compactOnly;

  constructor() {
    super();

    this.#modal = this.hasAttribute('modal') || device.state === device.COMPACT;
    this.#compactOnly = this.hasAttribute('compact-only');
    this.render();
  }

  template() {
    if (this.#modal) return `<mc-time-picker-mobile${this.hasAttribute('hour24') ? ' hour24 ' : ''}></mc-time-picker-mobile>`;
    else if (!this.#compactOnly) return `<mc-time-picker-input${this.hasAttribute('hour24') ? ' hour24 ' : ''}></mc-time-picker-input>`;
    else return '';
  }
}
customElements.define(MCTimePickerElement.tag, MCTimePickerElement);

