import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class SnackbarsPage extends Component {
  static title = 'Snackbars';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  basic() {
    mcSnackbar.show({
      message: 'Message goes here'
    });
  }

  async action() {
    await mcSnackbar.show({
      message: 'Message goes here',
      action: true,
      actionLabel: 'Done'
    });
    console.log('Snackbar dismissed');
  }

  async noClose() {
    await mcSnackbar.show({
      message: 'Message goes here',
      closeButton: false,
      ms: 6000
    });
  }
}
customElements.define('snackbars-page', SnackbarsPage);
