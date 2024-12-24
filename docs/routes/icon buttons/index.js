import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class IconButtonsPage extends Component {
  static title = 'Icon buttons';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('icon-buttons-page', IconButtonsPage);
