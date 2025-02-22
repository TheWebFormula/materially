import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class TablesPage extends Component {
  static title = 'Tables';
  static htmlTemplate = htmlTemplate;

  #abort;
  #onSort_bound = this.onSort.bind(this);
  #onPage_bound = this.onPage.bind(this);

  constructor() {
    super();
  }

  afterRender() {
    this.#abort = new AbortController();
    let table = document.querySelector('#tableasync');
    table.addEventListener('sort', this.#onSort_bound, { signal: this.#abort.Signal });
    table.addEventListener('page', this.#onPage_bound, { signal: this.#abort.Signal });

    this.getData({
      page: table.page,
      pageSize: table.pageSize,
      sort: table.sort,
      direction: table.direction
    }, 0);
  }

  disconnectedCallback() {
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }
  }


  onSort(event) {
    this.getData({
      page: event.target.page,
      pageSize: event.target.pageSize,
      sort: event.target.sort,
      direction: event.target.direction
    });
  }

  onPage(event) {
    this.getData({
      page: event.target.page,
      pageSize: event.target.pageSize,
      sort: event.target.sort,
      direction: event.target.direction
    });
  }
  


  async getData(listFilter = {
    page: 0,
    pageSize: 5,
    sort: 'id',
    direction: 'ascending'
  }, delay = 800) {
    if (delay > 0) document.querySelector('#tableasync').loading();
    return new Promise(resolve => {
      setTimeout(() => {
        let data = [...this.tableData];
        if (listFilter.sort) data.sort((a, b) => {
          const one = listFilter.direction !== 'descending' ? a[listFilter.sort] : b[listFilter.sort];
          const two = listFilter.direction !== 'descending' ? b[listFilter.sort] : a[listFilter.sort];
          const isNumbers = !isNaN(one) && !isNaN(two);
          if (isNumbers) return one - two;
          return one.localeCompare(two);
        })
        const start = Math.max(0, listFilter.page * listFilter.pageSize);
        // console.log(start, start + listFilter.pageSize, [...data].slice(start, start + listFilter.pageSize));
        document.querySelector('#tableasync').rowData = data.slice(start, start + listFilter.pageSize);
        if (delay > 0) document.querySelector('#tableasync').resolveLoading();
        resolve();
      }, delay);  
    });
  }


  tableData = [
    {
      id: 1,
      name: 'Zuma',
      breed: 'Ragdoll',
      gender: 'Male',
      age: 8
    },
    {
      id: 2,
      name: 'Luna',
      breed: 'Siamese',
      gender: 'Female',
      age: 5
    },
    {
      id: 3,
      name: 'Milo',
      breed: 'Maine Coon',
      gender: 'Male',
      age: 3
    },
    {
      id: 4,
      name: 'Bella',
      breed: 'Persian',
      gender: 'Female',
      age: 4
    },
    {
      id: 5,
      name: 'Oliver',
      breed: 'Bengal',
      gender: 'Male',
      age: 2
    },
    {
      id: 6,
      name: 'Charlie',
      breed: 'Sphynx',
      gender: 'Male',
      age: 6
    },
    {
      id: 7,
      name: 'Lucy',
      breed: 'British Shorthair',
      gender: 'Female',
      age: 7
    },
    {
      id: 8,
      name: 'Max',
      breed: 'Abyssinian',
      gender: 'Male',
      age: 4
    },
    {
      id: 9,
      name: 'Chloe',
      breed: 'Birman',
      gender: 'Female',
      age: 3
    },
    {
      id: 10,
      name: 'Simba',
      breed: 'Savannah',
      gender: 'Male',
      age: 5
    },
    {
      id: 11,
      name: 'Nala',
      breed: 'Russian Blue',
      gender: 'Female',
      age: 4
    },
    {
      id: 12,
      name: 'Oscar',
      breed: 'Scottish Fold',
      gender: 'Male',
      age: 6
    },
    {
      id: 13,
      name: 'Misty',
      breed: 'Norwegian Forest',
      gender: 'Female',
      age: 5
    },
    {
      id: 14,
      name: 'Leo',
      breed: 'Siberian',
      gender: 'Male',
      age: 3
    },
    {
      id: 15,
      name: 'Daisy',
      breed: 'Turkish Angora',
      gender: 'Female',
      age: 2
    },
    {
      id: 16,
      name: 'Jack',
      breed: 'Oriental Shorthair',
      gender: 'Male',
      age: 7
    },
    {
      id: 17,
      name: 'Sophie',
      breed: 'American Shorthair',
      gender: 'Female',
      age: 6
    },
    {
      id: 18,
      name: 'Toby',
      breed: 'Chartreux',
      gender: 'Male',
      age: 4
    },
    {
      id: 19,
      name: 'Lily',
      breed: 'Devon Rex',
      gender: 'Female',
      age: 3
    },
    {
      id: 20,
      name: 'Rocky',
      breed: 'Egyptian Mau',
      gender: 'Male',
      age: 5
    }
  ];
}
customElements.define('tables-page', TablesPage);
