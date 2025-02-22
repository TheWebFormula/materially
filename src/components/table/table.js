import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import '../progress-linear/index.js';


class MCTableElement extends HTMLComponentElement {
  static tag = 'mc-table';
  static useShadowRoot = false;
  static useTemplate = false;
  static styleSheets = [styles];

  #async = false;
  #select = false;
  #sort;
  #direction = 'ascending';
  #table;
  #rowsParent;
  #page;
  #pageSize = 10;
  #collator;
  #selectHeaderPosition;
  #selectRowPosition;
  #click_bound = this.#click.bind(this);
  #preventCheckboxChangeBubble_bound = this.#preventCheckboxChangeBubble.bind(this);

  #headerData;
  #rowData = [];
  #rowDataSorted;
  #rowTemplates = new Map();
  #value = new Set();

  constructor() {
    super();
  }

  static get observedAttributesExtended() {
    return [
      ['async', 'boolean'],
      ['select', 'boolean'],
      ['sort', 'string'],
      ['direction', 'string'],
      ['value', 'string'],
      ['page', 'int'],
      ['page-size', 'int']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get async() {
    return this.#async;
  }
  set async(value) {
    this.#async = !!value;
  }

  get select() {
    return this.#select;
  }
  set select(value) {
    this.#select = !!value;
  }

  get sort() {
    return this.#sort;
  }
  set sort(value) {
    this.#sort = value;
  }

  get direction() {
    return this.#direction;
  }
  set direction(value) {
    this.#direction = value;
  }

  get value() {
    return [...this.#value].join(',');
  }
  set value(value) {
    if (Array.isArray(value)) this.#value = new Set(value);
    else {
      let arr = (value || '').split(',')
      if (arr.length > 0) this.#value = new Set(arr);
      else this.#value = new Set();
    }
  }

  get page() {
    return this.#page;
  }
  set page(value) {
    const change = value != this.#page;
    this.#page = value;
    if (!this.#async && change) this.#renderRows();
  }

  get pageSize() {
    return this.#pageSize;
  }
  set pageSize(value) {
    const change = value != this.#pageSize;
    this.#pageSize = value;
    if (!this.#async && change) this.#renderRows();
  }

  get rowData() { return this.#rowData; }
  set rowData(value) {
    this.#rowData = value || [];
    this.#updateRowData();
    this.#renderRows();
  }

  get rows() { return this.#table.rows; }

  get bodyRows() { return this.#rowsParent.rows; }





  connectedCallback() {
    this.#table = this.querySelector('table');
    this.#rowsParent = this.querySelector('tbody') || this.#table;
    const pagination = this.querySelector('mc-table-pagination');
    if (pagination) {
      this.#page = parseInt(pagination.getAttribute('page') || 0);
      this.#pageSize = pagination.hasAttribute('size') && parseInt(pagination.getAttribute('size'));
    }

    this.#buildData();
    this.#updateRowData();
    this.#updateSortHeader();
    this.#renderRows();

    this.#table.addEventListener('click', this.#click_bound);
    if (this.#select) this.#table.addEventListener('change', this.#preventCheckboxChangeBubble_bound, { capture: true });
  }

  disconnectedCallback() {
    this.#table.removeEventListener('click', this.#click_bound);
    this.#table.removeEventListener('change', this.#preventCheckboxChangeBubble_bound, { capture: true });
  }


  loading() {
    this.classList.add('loading');
    const parent = this.querySelector('thead') || this.querySelector('table');
    parent.insertAdjacentHTML('beforeend', `
      <mc-progress-linear class="table-progress" indeterminate></mc-progress-linear>
    `);
    setTimeout(() => {
      let progress = this.querySelector('.table-progress');
      if (progress) progress.classList.add('show');
    }, 17);
  }

  resolveLoading() {
    this.classList.remove('loading');
    let progress = this.querySelector('.table-progress');
    if (progress) progress.remove();
  }


  #buildData() {
    this.#headerData = [];
    this.#selectHeaderPosition = undefined;
    let th = this.querySelectorAll('thead th');
    for (let i = 0; i < th.length; i++) {
      let header = th[i];
      const isSelect = !!header.querySelector('mc-checkbox');
      if (isSelect) {
        this.#selectHeaderPosition = i;
        header.classList.add('select');
      }
      const propertyAttr = header.getAttribute('property');
      this.#headerData.push({
        property: propertyAttr || header.textContent,
        element: header,
        isSelect
      });
    }
    
    if (this.#select && this.#selectHeaderPosition === undefined) {
      let th = document.createElement('th');
      th.classList.add('select');
      th.insertAdjacentHTML('afterbegin', '<mc-checkbox></mc-checkbox>');
      this.querySelector('thead tr').insertAdjacentElement('afterbegin', th);
      this.#headerData.unshift({
        element: th,
        isSelect: true
      });
      this.#selectHeaderPosition = 0;
    }
    this.#selectRowPosition = this.#selectHeaderPosition;


    this.#rowData = [];
    if (this.#rowsParent.rows.length === 0) return;
    const selectPosition = [...this.#rowsParent.rows[0].querySelectorAll('td')].findIndex(v => !!v.querySelector('mc-checkbox'));
    this.#selectRowPosition = selectPosition > -1 ? selectPosition : this.#select ? 0 : undefined;
    for (let i = 0; i < this.#rowsParent.rows.length; i++) {
      let row = this.#rowsParent.rows[i];
      let tds = row.querySelectorAll('td');
      let data = { id: row.getAttribute('value') || i };
      let ri = 0;
      for (let hi = 0; hi < this.#headerData.length; hi++, ri++) {
        let hd = this.#headerData[hi];
        if (hd.isSelect) {
          hi++;
          hd = this.#headerData[hi];
          if (!hd) continue;
        }
        if (!!tds[ri].querySelector('mc-checkbox')) ri++;
        data[hd.property] = tds[ri].textContent || '';
      }
      this.#rowData.push(data);
    }
  }

  #updateRowData() {
    this.#rowTemplates.clear();
    for (let i = 0; i < this.#rowData.length; i++) {
      let row = this.#rowData[i];
      let template = `<tr value="${row.id}">`;
      
      for (let j = 0; j < this.#headerData.length; j++) {
        let hd = this.#headerData[j];
        if (j === this.#selectRowPosition) {
          template += `<td class="select"><mc-checkbox></mc-checkbox></td>`;
        } else {
          const data = row[hd.property] || '';
          template += `<td>${data}</td>`;
        }
      }
      template += '</tr>';
      this.#rowTemplates.set(row.id, template);
    }
  }

  #renderRows() {
    this.#rowDataSorted = [...this.#rowData];
    if (!this.#async && this.#sort) {
      if (!this.#collator) this.#collator = new Intl.Collator();
      let collator = this.#collator;
      this.#rowDataSorted.sort((a, b) => {
        const one = this.#direction !== 'descending' ? a[this.#sort] : b[this.#sort];
        const two = this.#direction !== 'descending' ? b[this.#sort] : a[this.#sort];
        const isNumbers = !isNaN(one) && !isNaN(two);
        if (isNumbers) return one - two;
        return collator.compare(one, two);
      })
    }
    
    const page = this.#page || 0;
    const pageSize = this.#pageSize || this.#rowData.length;
    // the table can have all the data and paginate locally, or the table can be feed pre paginated data
    const isLocalPaginationNeeded = this.#rowData.length > this.#pageSize;
    const start = isLocalPaginationNeeded ? Math.max(0, page * this.#pageSize) : 0;

    let template = '';
    for (let i = 0; i < pageSize; i++) {
      const data = this.#rowDataSorted[i + start];
      if (!data) continue;
      template += this.#rowTemplates.get(data.id);
    }
    this.#rowsParent.innerHTML = template;
    // prevents attrs from being accessed be checkbox connection
    requestAnimationFrame(() => {
      this.#updateSelectionDisplay();
    });
  }

  #updateSortHeader() {
    const currentSortedHeader = this.querySelector('[aria-sort]');
    if (currentSortedHeader) currentSortedHeader.removeAttribute('aria-sort');
    if (!this.#sort) return;

    const headerData = this.#headerData.find(v => v.property === this.#sort);
    if (this.#sort) headerData.element.setAttribute('aria-sort', this.#direction);
    else headerData.element.removeAttribute('aria-sort');
  }

  #changeSortFromHeaderClick(element) {
    const headerData = this.#headerData.find(v => v.element === element);
    const currentSortedHeader = this.querySelector('[aria-sort]');
    this.#sort = headerData.property;

    if (!currentSortedHeader || headerData.element !== currentSortedHeader) {
      this.#direction = 'ascending';
    } else {
      const currentDirection = this.#direction;
      if (currentDirection === 'descending') {
        this.#direction = 'ascending';
        this.#sort = '';
      } else {
        this.#direction = 'descending';
      }
    }

    this.#updateSortHeader();
  }



  #click(event) {
    if (event.target.nodeName === 'MC-CHECKBOX') {
      if (event.target.parentElement.nodeName === 'TH') this.#selectPage(event.target);
      else this.#selectRow(event.target);
      this.#updateSelectionDisplay();
      this.dispatchEvent(new Event('change'));
    } else if (event.target.nodeName === 'TH') {
      this.#changeSortFromHeaderClick(event.target);

      if (this.#async) this.dispatchEvent(new CustomEvent('sort'));
      else this.#renderRows();
    }
  }


  #selectRow(target) {
    // thead can contain a row, we do not want to select that
    if (!this.#rowsParent.contains(target)) return;

    while (target !== this.#rowsParent) {
      if (target.nodeName === 'TR') break;
      target = target.parentElement;
    }
    if (target.nodeName !== 'TR') return;

    if (target.hasAttribute('selected')) this.#value.delete(target.getAttribute('value'));
    else this.#value.add(target.getAttribute('value'));
  }

  #selectPage(checkboxElement) {
    const checked = checkboxElement.indeterminate || checkboxElement.checked === false;
    for (const row of this.bodyRows) {
      if (checked) this.#value.add(row.getAttribute('value'));
      else this.#value.delete(row.getAttribute('value'));
    }
  }

  #updateSelectionDisplay() {
    if (!this.#select) return;

    let all = this.bodyRows.length > 0;
    let some = false;
    for (const row of this.bodyRows) {
      let contains = this.#value.has(row.getAttribute('value'));
      row.toggleAttribute('selected', contains);
      row.querySelector('mc-checkbox').checked = contains;
      if (contains) some = true;
      else all = false;
    }

    let headerCheckbox = this.querySelector('th mc-checkbox');
    headerCheckbox.checked = false;
    headerCheckbox.indeterminate = false;
    if (all) headerCheckbox.checked = true;
    else if (some) headerCheckbox.indeterminate = true;
  }

  // mc-checkbox change events bubble, we do not want that since we dispatch a change event on the component
  #preventCheckboxChangeBubble(event) {
    if (event.target.nodeName === 'MC-CHECKBOX') {
      event.stopPropagation();
    }
  }

  pageChange() {
    if (!this.#async) this.#updateSelectionDisplay();
  }
}
customElements.define(MCTableElement.tag, MCTableElement);
