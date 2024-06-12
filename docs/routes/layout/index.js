import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Layout';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
