import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class RadiosPage extends Component {
  static title = 'Radios';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('radios-page', RadiosPage);
