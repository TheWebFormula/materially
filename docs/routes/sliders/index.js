import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class SlidersPage extends Component {
  static title = 'Sliders';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('sliders-page', SlidersPage);
