import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Text fields';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
