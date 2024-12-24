import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class TopAppBarsPage  extends Component {
  static title = 'Top app bars';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('top-app-bars-page', TopAppBarsPage);
