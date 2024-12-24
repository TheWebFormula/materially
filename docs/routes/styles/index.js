import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class StylesPage extends Component {
  static title = 'Styles';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('styles-page', StylesPage);
