import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class LayoutPage extends Component {
  static title = 'Layout';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('layout-page', LayoutPage);
