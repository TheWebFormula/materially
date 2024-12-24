import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class SearchPage extends Component {
  static title = 'Search';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  afterRender() {
    this.one();
    this.two();
    this.three();
    this.four();
    this.five();
  }

  async wait(time = 1000) {
    return new Promise(resolve => {
      setTimeout(resolve, time)
    });
  }


  one() {
    const searchOne = document.querySelector('#one');
    searchOne.addEventListener('change', () => console.log(searchOne.selected));
    searchOne.addEventListener('search', async () => {
      await this.wait(500);
      if (!searchOne.value) {
        searchOne.results = [];
        searchOne.suggestions = [];
        return;
      }

      searchOne.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox'
        },
        {
          value: 'two',
          display: 'Two',
          container: 'secondary'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox'
        },
        {
          value: 'four',
          display: 'Four',
          container: 'secondary'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox'
        },
        {
          value: 'seven',
          display: 'Seven',
          container: 'secondary'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox'
        },
        {
          value: 'nine',
          display: 'Nine',
          container: 'secondary'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchOne.value.toLowerCase()));


      searchOne.suggestions = [
        {
          value: 'one'
        },
        {
          value: 'two'
        },
        {
          value: 'three'
        },
        {
          value: 'four'
        },
        {
          value: 'five'
        }
      ].filter(v => v.value.toLocaleLowerCase().includes(searchOne.value.toLowerCase()));
    });
  }

  two() {
    const searchTwo = document.querySelector('#two');
    if (searchTwo.value === undefined) {
      return;
    }

    searchTwo.suggestions = [
      {
        value: 'one'
      },
      {
        value: 'two'
      },
      {
        value: 'three'
      },
      {
        value: 'four'
      },
      {
        value: 'five'
      }
    ].filter(v => v.value.toLocaleLowerCase().includes(searchTwo.value.toLowerCase()));
    searchTwo.suggestions = [];
    searchTwo.addEventListener('search', () => {
      if (!searchTwo.value) return searchTwo.results = [];
      searchTwo.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox'
        },
        {
          value: 'two',
          display: 'Two',
          icon: 'inbox'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox'
        },
        {
          value: 'four',
          display: 'Four',
          icon: 'inbox'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox'
        },
        {
          value: 'seven',
          display: 'Seven',
          icon: 'inbox'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox'
        },
        {
          value: 'nine',
          display: 'Nine',
          icon: 'inbox'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchTwo.value.toLowerCase()));
    });
  }

  three() {
    const searchThree = document.querySelector('#three');
    if (searchThree.value === undefined) {
      return;
    }

    searchThree.addEventListener('search', () => {
      if (!searchThree.value) return searchThree.results = [];
      searchThree.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox'
        },
        {
          value: 'two',
          display: 'Two',
          icon: 'inbox'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox'
        },
        {
          value: 'four',
          display: 'Four',
          icon: 'inbox'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox'
        },
        {
          value: 'seven',
          display: 'Seven',
          icon: 'inbox'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox'
        },
        {
          value: 'nine',
          display: 'Nine',
          icon: 'inbox'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchThree.value.toLowerCase()));
    });
  }

  four() {
    const searchFour = document.querySelector('#four');
    if (searchFour.value === undefined) {
      return;
    }

    searchFour.addEventListener('change', () => console.log(searchFour.selected));
    searchFour.addEventListener('search', () => {
      if (!searchFour.value) {
        searchFour.results = [];
        searchFour.suggestions = [];
        return;
      }

      searchFour.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'two',
          display: 'Two',
          container: 'secondary'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'four',
          display: 'Four',
          container: 'secondary'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'seven',
          display: 'Seven',
          container: 'secondary'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'nine',
          display: 'Nine',
          container: 'secondary'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox',
          container: 'primary'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchFour.value.toLowerCase()));


      searchFour.suggestions = [
        {
          value: 'one'
        },
        {
          value: 'two'
        },
        {
          value: 'three'
        },
        {
          value: 'four'
        },
        {
          value: 'five'
        }
      ].filter(v => v.value.toLocaleLowerCase().includes(searchFour.value.toLowerCase()));
    });
  }

  five() {
    const searchFive = document.querySelector('#five');
    if (searchFive.value === undefined) {
      return;
    }
    searchFive.addEventListener('change', () => console.log({
      selected: searchFive.selected,
      filters: searchFive.filters
    }));
    searchFive.addEventListener('search', () => {
      if (!searchFive.value) {
        searchFive.results = [];
        searchFive.suggestions = [];
        return;
      }
      if (searchFive.filters.includes('Event numbers')) {
        searchFive.results = [
          {
            value: 'two',
            display: 'Two',
            container: 'secondary'
          },
          {
            value: 'four',
            display: 'Four',
            container: 'secondary'
          },
          {
            value: 'six',
            display: 'Six',
            icon: 'inbox',
            container: 'primary'
          },
          {
            value: 'eight',
            display: 'Eight',
            icon: 'inbox',
            container: 'primary'
          },
          {
            value: 'ten',
            display: 'Ten',
            icon: 'inbox',
            container: 'primary'
          }
        ].filter(v => v.display.toLocaleLowerCase().includes(searchFive.value.toLowerCase()));

        searchFive.suggestions = [
          {
            value: 'two'
          },
          {
            value: 'four'
          }
        ].filter(v => v.value.toLocaleLowerCase().includes(searchFive.value.toLowerCase()));

        return;
      }

      searchFive.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'two',
          display: 'Two',
          container: 'secondary'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'four',
          display: 'Four',
          container: 'secondary'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'seven',
          display: 'Seven',
          container: 'secondary'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'nine',
          display: 'Nine',
          container: 'secondary'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox',
          container: 'primary'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchFive.value.toLowerCase()));


      searchFive.suggestions = [
        {
          value: 'one'
        },
        {
          value: 'two'
        },
        {
          value: 'three'
        },
        {
          value: 'four'
        },
        {
          value: 'five'
        }
      ].filter(v => v.value.toLocaleLowerCase().includes(searchFive.value.toLowerCase()));
    });
  }
}
customElements.define('search-page', SearchPage);
