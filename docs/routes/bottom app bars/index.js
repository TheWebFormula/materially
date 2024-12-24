import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class BottomAppBarsPage extends Component {
  static title = 'Bottom app bars';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('bottom-app-bars-page', BottomAppBarsPage);
