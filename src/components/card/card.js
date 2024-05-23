import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './card.css' assert { type: 'css' };
import '../state-layer/index.js';
// import util from '../../core/util.js';
// import Drag from '../../core/Drag.js';
// import device from '../../core/device.js';
import {
  expand_more_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../helpers/svgs.js';


export default class WFCCardElement extends HTMLComponentElement {
  static tag = 'wfc-card';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  constructor() {
    super();

    this.render();
  }

  template() {
    return /*html*/`
      <div class="placeholder"></div>
      <div class="container">
        <wfc-icon-button class="elevated fullscreen-close">
          <wfc-icon>${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</wfc-icon>
        </wfc-icon-button>
        <slot name="swipe-action"></slot>
        <slot name="image"></slot>
        <div class="content">
          <div class="expand-arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</div>
          <slot name="headline"></slot>
          <slot name="subhead"></slot>
          <slot name="supporting-text"></slot>
          <slot name="expanded"></slot>
          <slot class="default-slot"></slot>
          <slot name="action"></slot>
        </div>
        <wfc-state-layer ripple="false" enabled="false" class="temp"></wfc-state-layer>
      </div>
    `;
  }
}

customElements.define(WFCCardElement.tag, WFCCardElement);
