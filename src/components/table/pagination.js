import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './pagination.css' assert { type: 'css' };
import {
  chevron_left_FILL1_wght400_GRAD0_opsz24,
  first_page_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24
} from '../../helpers/svgs.js';


class MCTablePaginationElement extends HTMLComponentElement {
  static tag = 'mc-table-pagination';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #tableComponent;
  #page = 0
  #size = 10;
  #sizes;
  #total;
  #sizesElement;
  #preventChangeBubble_bound = this.#preventChangeBubble.bind(this);
  #nextPage_bound = this.#nextPage.bind(this);
  #previousPage_bound = this.#previousPage.bind(this);
  #firstPage_bound = this.#firstPage.bind(this);
  #lastPage_bound = this.#lastPage.bind(this);
  #pageSizeChange_bound = this.#pageSizeChange.bind(this);

  constructor() {
    super();

    this.render();
    this.#sizesElement = this.shadowRoot.querySelector('.sizes');
  }

  template() {
    return /*html*/`
      <div class="sizes">
        <span class="label">Items per page</span>
        <mc-select outlined condensed></mc-select>
      </div>

      <div class="page-info"></div>

      <div class="controls">
        <mc-icon-button class="first-page">${first_page_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24}</mc-icon-button>
        <mc-icon-button class="previous-page">${chevron_left_FILL1_wght400_GRAD0_opsz24}</mc-icon-button>
        <div class="page-number">1</div>
        <mc-icon-button class="next-page flip">${chevron_left_FILL1_wght400_GRAD0_opsz24}</mc-icon-button>
        <mc-icon-button class="last-page flip">${first_page_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24}</mc-icon-button>
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['page', 'int'],
      ['size', 'int'],
      ['sizes', 'string'],
      ['total', 'int']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get page() {
    return this.#page;
  }
  set page(value) {
    this.#page = value;
  }

  get size() {
    return this.#size;
  }
  set size(value) {
    this.#size = value;
  }

  get sizes() {
    return this.#sizes;
  }
  set sizes(value) {
    this.#sizes = value.split(',').filter(v => !isNaN(v)).map(v => parseInt(v));
    this.#sizesElement.classList.toggle('show', this.#sizes.length > 0);
  }

  get total() {
    return this.#total;
  }
  set total(value) {
    this.#total = value;
    this.classList.toggle('has-total', !isNaN(value));
  }

  get hasTotal() {
    return !!this.#total;
  }
  get totalPages() {
    return Math.ceil(this.#total / this.#size);
  }

  get rowCount() {
    return this.#tableComponent.bodyRows.length;
  }

  connectedCallback() {
    this.#tableComponent = this.parentElement;
    this.#tableComponent.pageSize = this.#size;
    this.#tableComponent.page = this.#page;

    const sizesSelect = this.#sizesElement.querySelector('mc-select');
    sizesSelect.innerHTML = this.#sizes.map(v => `<mc-option value="${v}">${v}</mc-option>`).join('');
    requestAnimationFrame(() => {
      sizesSelect.value = this.#size;
    });

    this.#updatePageInfo();

    this.addEventListener('click', this.#preventChangeBubble_bound);
    this.shadowRoot.querySelector('.next-page').addEventListener('click', this.#nextPage_bound);
    this.shadowRoot.querySelector('.previous-page').addEventListener('click', this.#previousPage_bound);
    this.shadowRoot.querySelector('.first-page').addEventListener('click', this.#firstPage_bound);
    this.shadowRoot.querySelector('.last-page').addEventListener('click', this.#lastPage_bound);
    this.shadowRoot.querySelector('mc-select').addEventListener('change', this.#pageSizeChange_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#preventChangeBubble_bound);
    this.shadowRoot.querySelector('.next-page').removeEventListener('click', this.#nextPage_bound);
    this.shadowRoot.querySelector('.previous-page').removeEventListener('click', this.#previousPage_bound);
    this.shadowRoot.querySelector('.first-page').removeEventListener('click', this.#firstPage_bound);
    this.shadowRoot.querySelector('.last-page').removeEventListener('click', this.#lastPage_bound);
    this.shadowRoot.querySelector('mc-select').removeEventListener('change', this.#pageSizeChange_bound);
  }

  #preventChangeBubble(event) {
    event.stopPropagation();
  }

  #nextPage() {
    if (this.rowCount != this.#size) return;
    if (this.hasTotal && this.#page + 1 > this.totalPages - 1) return;

    this.#page += 1;
    this.#updatePageInfo();
    this.#tableComponent.pageChange();
    this.#tableComponent.dispatchEvent(new CustomEvent('page'));
  }

  #previousPage() {
    if (this.#page - 1 < 0) return;

    this.#page -= 1;
    this.#updatePageInfo();
    this.#tableComponent.pageChange();
    this.#tableComponent.dispatchEvent(new CustomEvent('page'));
  }

  #firstPage() {
    if (this.#page === 0) return;
    this.#page = 0;
    this.#updatePageInfo();
    this.#tableComponent.pageChange();
    this.#tableComponent.dispatchEvent(new CustomEvent('page'));
  }

  #lastPage() {
    if (!this.hasTotal) {
      console.warn('Must set mc-table total to use last page button');
      return;
    }
    this.#page = this.totalPages - 1;
    this.#updatePageInfo();
    this.#tableComponent.pageChange();
    this.#tableComponent.dispatchEvent(new CustomEvent('page'));
  }

  #pageSizeChange(event) {
    // calculate page because size change
    const newSize = event.target.value;
    let start = this.#page * this.#size + 1;
    const newEnd = start + newSize;
    const overflow = this.#total - newEnd;
    if (overflow < 0) {
      start = Math.max(0, start + overflow);
    } 
    
    this.size = event.target.value;
    this.#page = Math.ceil(start / newSize);

    this.#tableComponent.pageSize = this.size;
    this.#updatePageInfo();
    this.#tableComponent.pageChange();
    this.#tableComponent.dispatchEvent(new CustomEvent('page'));
  }

  #updatePageInfo() {
    this.#tableComponent.page = this.#page;
    this.shadowRoot.querySelector('.page-number').textContent = this.#page + 1;

    if (!this.hasTotal) return;

    const start = this.#page * this.#size + 1;
    this.shadowRoot.querySelector('.page-info').textContent = `${start} - ${Math.min(this.#total, start + this.#size - 1)} of ${this.#total}`;
  }
}
customElements.define(MCTablePaginationElement.tag, MCTablePaginationElement);
