import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Navigation';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
