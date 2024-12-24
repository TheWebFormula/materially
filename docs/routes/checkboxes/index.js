import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class CheckboxesPage extends Component {
  static title = 'Checkboxes';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('checkboxes-page', CheckboxesPage);
