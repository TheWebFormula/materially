import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './tab-panel-group.css' assert { type: 'css' };
import '../state-layer/index.js';

class MCTabPanelGroupElement extends HTMLComponentElement {
  static tag = 'mc-tab-panel-group';
  static styleSheets = [styles];

  constructor() {
    super();
  }
}
customElements.define(MCTabPanelGroupElement.tag, MCTabPanelGroupElement);
