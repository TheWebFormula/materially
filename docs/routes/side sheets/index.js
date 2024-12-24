import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class SideSheetsPage extends Component {
  static title = 'Side sheets';
  static htmlTemplate = htmlTemplate;

  oneOpen = new Signal(true);
  twoOpen = new Signal(false);
  threeOpen = new Signal(true);
  predictiveOpen = new Signal(false);

  constructor() {
    super();
  }
}
customElements.define('side-sheets-page', SideSheetsPage);
