import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class SegmentedButtonsPage extends Component {
  static title = 'Segmented buttons';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('segmented-buttons-page', SegmentedButtonsPage);
