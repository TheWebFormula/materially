import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'FABs';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  toggleHideStates({ hideLabel, hide }) {
    if (hideLabel === true) {
      document.querySelector('#hide-switch').checked = false;
      document.querySelector('#fixed-fab').removeAttribute('auto-hide');
      document.querySelector('#fixed-fab').setAttribute('auto-hide-label', '');
    } else if (hide === true) {
      document.querySelector('#hide-label-switch').checked = false;
      document.querySelector('#fixed-fab').removeAttribute('auto-hide-label');
      document.querySelector('#fixed-fab').setAttribute('auto-hide', '');
    } else if (hideLabel === false) {
      document.querySelector('#fixed-fab').removeAttribute('auto-hide-label');
    } else if (hide === false) {
      document.querySelector('#fixed-fab').removeAttribute('auto-hide');
    }
  }
}
