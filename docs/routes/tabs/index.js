import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class TabsPage extends Component {
  static title = 'Tabs';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('tabs-page', TabsPage);
