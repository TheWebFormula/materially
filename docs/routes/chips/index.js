import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class ChipsPage extends Component {
  static title = 'Chips';
  static htmlTemplate = htmlTemplate;

  #counter = 0;

  constructor() {
    super();
  }

  updateValues() {
    document.querySelector('#chip-set-1').addChip({
      type: 'filter',
      name: ++this.#counter,
      label: this.#counter,
      value: this.#counter,
      checked: false
    });
  }
}
customElements.define('chips-page', ChipsPage);
