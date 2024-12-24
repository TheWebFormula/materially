import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class IconsPage extends Component {
  static title = 'Icons';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('icons-page', IconsPage);
