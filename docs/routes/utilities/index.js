import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class UtilitiesPage extends Component {
  static title = 'Utilities';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('utilities-page', UtilitiesPage);
