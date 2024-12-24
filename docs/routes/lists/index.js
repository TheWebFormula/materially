import { Component, Signal, html } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class ListsPage extends Component {
  static title = 'Lists';
  static htmlTemplate = htmlTemplate;

  reorderSwap = new Signal(false);
  items = [...new Array(50)].map((_, i) => ({ headline: i }));

  constructor() {
    super();
  }

  #listReorder_bound = this.#listReorder.bind(this);

  afterRender() {
    document.querySelector('#swipe-actions').addEventListener('swipeactionstart', event => {
      event.target.remove();
    });
    document.querySelector('#list-reorder').addEventListener('reorder', this.#listReorder_bound);
    document.querySelector('#virtual').virtualTemplate = data => html`<mc-list-item>
      <div slot="headline">${data.headline}</div>
    </mc-list-item>`;
    document.querySelector('#virtual').virtualData = this.items;
  }

  disconnectedCallback() {
    const list = document.querySelector('#list-reorder');
    if (list) list.removeEventListener('reorder', this.#listReorder_bound);
  }

  #listReorder(event) {
    console.log('list items have been reorder. listElement.children will be the new order');
  }
}
customElements.define('lists-page', ListsPage);
