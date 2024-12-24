import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class MenusPage extends Component {
  static title = 'Menus';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('menus-page', MenusPage);
