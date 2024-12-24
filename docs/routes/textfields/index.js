import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class TextfieldsPage extends Component {
  static title = 'Text fields';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('textfields-page', TextfieldsPage);
