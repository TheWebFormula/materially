import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Button';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
