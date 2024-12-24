import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class SwitchesPage extends Component {
  static title = 'Switches';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('switches-page', SwitchesPage);
