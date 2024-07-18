import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Side sheets';
  static htmlTemplate = htmlTemplate;

  oneOpen = new Signal(true);
  twoOpen = new Signal(false);
  threeOpen = new Signal(true);

  constructor() {
    super();
  }
}
