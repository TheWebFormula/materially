import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Menus';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
