import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Cards';
  static htmlTemplate = htmlTemplate;

  reorderSwap = new Signal(false);

  constructor() {
    super();

    this.cardArray = [...new Array(6).keys()].map((_, i) => ({ height: i % 4 === 0 ? '400px' : '' }));
  }

  onSwipeAction(element) {
    console.log('checked', element.hasAttribute('checked'));
  }
}
