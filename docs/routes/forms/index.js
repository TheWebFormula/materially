import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class FormsPage extends Component {
  static title = 'Forms';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  submit(form) {
    const formData = new FormData(form);
    console.log([...formData.entries()]);

    mcDialog.simple({
      headline: 'Submitted',
      message: 'All validations passed'
    })
  }
}
customElements.define('forms-page', FormsPage);
