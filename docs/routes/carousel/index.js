import { Component } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class CarouselPage extends Component {
  static title = 'Carousel';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
customElements.define('carousel-page', CarouselPage);
