import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Selects';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  afterRender() {
    document.querySelector('#async-filter-select').addEventListener('search', e => {
      this.filter(e.target);
    });
  }

  async filter(select) {
    await this.wait(500);
    const options = [
      {
        label: 'One',
        value: '1'
      },
      {
        label: 'Two',
        value: '2'
      },
      {
        label: 'Three',
        value: '3'
      },
      {
        label: 'Four',
        value: '4'
      },
      {
        label: 'Five',
        value: '5'
      },
      {
        label: 'Six',
        value: '6'
      },
      {
        label: 'Seven',
        value: '7'
      },
      {
        label: 'Eight',
        value: '8'
      },
      {
        label: 'Nine',
        value: '9'
      },
      {
        label: 'Ten',
        value: '10'
      }
    ].filter(v => v.label.toLowerCase().includes(select.displayValue.toLowerCase().trim()));

    select.setOptions(options);
  }

  async wait(time = 1000) {
    return new Promise(resolve => {
      setTimeout(resolve, time)
    });
  }
}
