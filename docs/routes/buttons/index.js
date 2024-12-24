import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class ButtonsPage extends Component {
  static title = 'Button';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('buttons-page', ButtonsPage);
