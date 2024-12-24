import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class PullToRefreshPage extends Component {
  static title = 'Pull to refresh';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  afterRender() {
    const element = document.querySelector('mc-pull-to-refresh');

    element.addEventListener('refresh', () => {
      console.log('ok')
      setTimeout(() => {
        element.resolve();
      }, 1600);
    })
  }
}
customElements.define('pull-to-refresh-page', PullToRefreshPage);
