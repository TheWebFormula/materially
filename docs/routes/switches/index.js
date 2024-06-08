import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Switches';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
