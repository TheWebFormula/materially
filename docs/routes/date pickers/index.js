import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class DatePickersPage extends Component {
  static title = 'Date pickers';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  get min() {
    return mcDate.format(mcDate.addToDateByParts(new Date(), { day: -10 }), 'YYYY-MM-dd');
  }
  get max() {
    return mcDate.format(mcDate.addToDateByParts(new Date(), { day: 10 }), 'YYYY-MM-dd');
  }
}
customElements.define('date-pickers-page', DatePickersPage);
