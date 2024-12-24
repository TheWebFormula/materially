import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class BadgesPage extends Component {
  static title = 'Badges';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('badges-page', BadgesPage);
