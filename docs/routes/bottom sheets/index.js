import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class BottomSheetsPage extends Component {
  static title = 'Bottom sheets';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('bottom-sheets-page', BottomSheetsPage);
