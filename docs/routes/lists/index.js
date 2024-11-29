import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

export default class extends Component {
  static title = 'Lists';
  static htmlTemplate = htmlTemplate;

  reorderSwap = new Signal(false);

  constructor() {
    super();
  }

  #listReorder_bound = this.#listReorder.bind(this);

  afterRender() {
    document.querySelector('#swipe-actions').addEventListener('swipeactionstart', event => {
      event.target.remove();
    });
    document.querySelector('#list-reorder').addEventListener('reorder', this.#listReorder_bound);
  }

  disconnectedCallback() {
    const list = document.querySelector('#list-reorder');
    if (list) list.removeEventListener('reorder', this.#listReorder_bound);
  }

  #listReorder(event) {
    console.log('list items have been reorder. listElement.children will be the new order');
  }
}
