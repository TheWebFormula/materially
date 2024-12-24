import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class TooltipsPage extends Component {
  static title = 'Tooltips';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('tooltips-page', TooltipsPage);
