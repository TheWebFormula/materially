import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
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
