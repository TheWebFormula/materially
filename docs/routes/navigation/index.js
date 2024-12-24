import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class NavigationPage extends Component {
  static title = 'Navigation';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('navigation-page', NavigationPage);
