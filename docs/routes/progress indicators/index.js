import { Component, Signal } from '@thewebformula/lithe';
import htmlTemplate from './page.html';

class ProgressIndicatorsPage extends Component {
  static title = 'Progress indicators';
  static htmlTemplate = htmlTemplate;

  linearInterval;
  linearPercent = new Signal(0);

  constructor() {
    super();
  }

  disconnectedCallback() {
    clearInterval(this.linearInterval);
  }

  afterRender() {
    this.linearInterval = setInterval(() => {
      this.linearPercent.value += 0.1;
      if (this.linearPercent.value > 1) this.linearPercent.value = 0;
    }, 200);
  }
}
customElements.define('progress-indicators-page', ProgressIndicatorsPage);
