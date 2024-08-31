import MCSurfaceElement from '../surface/index.js';
import surfaceStyles from '../surface/component.css' assert { type: 'css' };
import styles from './time-picker-input.css' assert { type: 'css' };
import util from '../../helpers/util.js';
import {
  getHourData,
  getMinuteData,
  getHour,
  parseTextfieldTime,
  getPaddedHour24
} from './helper.js';


class MCTimePickerInputElement extends MCSurfaceElement {
  static tag = 'mc-time-picker-input';
  static styleSheets = [surfaceStyles, styles];

  #abort;
  #textfield;
  #hour;
  #paddedHour24;
  #minute;
  #paddedMinute;
  #meridiem;
  #click_bound = this.#click.bind(this);
  #onKeyDown_bound = this.#onKeyDown.bind(this);
  #clickOutside_bound = this.#clickOutside.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    this.ariaLabel = 'time picker';
    this.#textfield = this.parentElement.parentElement;
    this.preventClose = true;
    this.anchor = this.#textfield;
  }

  template() {
    return /*html*/`
      <div class="container">
        <div class="hours subcontainer"></div>
        <div class="minutes subcontainer"></div>
        <div class="meridiems subcontainer">
          <button class="am meridiem" value="AM">AM</button>
          <button class="pm meridiem" value="PM">PM</button>
        </div>
      </div>
    `;
  }


  get min() {
    return this.#textfield.min;
  }

  get max() {
    return this.#textfield.max;
  }

  get step() {
    return this.#textfield.step;
  }

  get hour() { return this.#hour; }
  set hour(value) {
    const parsed = getHour(value, this.meridiem);
    this.#hour = parsed.hour;
    // this.#paddedHour = parsed.paddedHour;
    this.#paddedHour24 = parsed.paddedHour24;
  }

  get minute() { return this.#minute; }
  set minute(value) {
    this.#minute = parseInt(value);
    this.#paddedMinute = this.#minute < 10 ? `0${this.#minute}` : `${this.#minute}`;
  }

  get meridiem() { return this.#meridiem; }
  set meridiem(value) {
    this.#meridiem = value;
    this.#paddedHour24 = getPaddedHour24(this.#paddedHour24, value);
  }


  connectedCallback() {
    super.connectedCallback();

    this.#abort = new AbortController();
    let hourData = getHourData(this.step, this.hasAttribute('hour24'));
    let minuteData = getMinuteData(this.step);
    if (hourData.length) this.shadowRoot.querySelector('.hours').innerHTML = hourData.sort((a, b) => a.hour > b.hour ? 1 : -1).map(v => `<button class="hour" aria-label="${v.hour} hour" value="${v.hour}">${v.paddedHour}</button>`).join('\n');
    // else this.shadowRoot.querySelector('.hours').style.width = 0;
    if (minuteData.length) this.shadowRoot.querySelector('.minutes').innerHTML = minuteData.map(v => `<button class="minute" aria-label="${v.minute} minute" value="${v.minute}">${v.display ? v.paddedMinute : ''}</button>`).join('\n');
    // else this.shadowRoot.querySelector('.minutes').style.width = 0;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
  }


  onShow() { 
    super.onShow();
    
    let time = parseTextfieldTime(this.#textfield);
    this.#meridiem = time.meridiem;
    this.hour = time.hour;
    this.minute = time.minute;
    if (this.#textfield.value) this.#updateDisplay();
    this.#updateScrollPositions();

    let focusItem = this.shadowRoot.querySelector('.selected') || this.shadowRoot.querySelector('.hour');
    focusItem.focus();

    this.shadowRoot.querySelector('.container').addEventListener('click', this.#click_bound);
    window.addEventListener('click', this.#clickOutside_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#onKeyDown_bound, { signal: this.#abort.signal });
  }

  onHide() {
    super.onHide();
    window.removeEventListener('click', this.#clickOutside_bound);
    window.removeEventListener('keydown', this.#onKeyDown_bound);
  }

  #click(event) {
    if (event.target.classList.contains('hour')) {
      const selected = this.shadowRoot.querySelector('.hour.selected');
      if (selected) selected.classList.remove('selected');
      event.target.classList.add('selected');
      this.hour = event.target.value;

    } else if (event.target.classList.contains('minute')) {
      const selected = this.shadowRoot.querySelector('.minute.selected');
      if (selected) selected.classList.remove('selected');
      event.target.classList.add('selected');
      this.minute = event.target.value;
    } else if (event.target.classList.contains('meridiem')) {
      const selected = this.shadowRoot.querySelector('.meridiems .selected');
      if (selected) selected.classList.remove('selected');
      event.target.classList.add('selected');
      this.meridiem = event.target.value;
    }

    this.#updateInput();
  }

  #updateInput() {
    let newValue = `${this.#paddedHour24}:${this.#paddedMinute}`;
    let change = this.#textfield.value !== newValue;
    if (!change) return;
    this.#updateDisplay();
    this.#textfield.value = newValue;
    if (change) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #updateDisplay() {
    [...this.querySelectorAll('.selected')].forEach(e => e.classList.remove('selected'));
    const hourSelected = this.shadowRoot.querySelector(`.hour[value="${this.#hour}"]`);
    if (hourSelected) hourSelected.classList.add('selected');
    const minuteSelected = this.shadowRoot.querySelector(`.minute[value="${this.#minute}"]`);
    if (minuteSelected) minuteSelected.classList.add('selected');
    
    this.shadowRoot.querySelector('.am').classList.toggle('selected', this.meridiem === 'AM');
    this.shadowRoot.querySelector('.pm').classList.toggle('selected', this.meridiem === 'PM');
  }

  #clickOutside(event) {
    if (event.target === this.#textfield || this.contains(event.target)) return;
    this.hidePopover();
  }

  #onKeyDown(event) {
    const active = this.shadowRoot.activeElement || this.shadowRoot.querySelector('.hour.selected') || this.shadowRoot.querySelector('.hour');
    const container = active.parentElement;
    let type = 'meridiem';
    if (container.classList.contains('hours')) type = 'hour';
    if (container.classList.contains('minutes')) type = 'minute';

    let next;

    // move from first option to select input
    if (event.key === 'ArrowUp') {
      next = util.getNextFocusableElement(container, true, this.#acceptFilter, true);
    } if (event.key === 'ArrowDown') {
      next = util.getNextFocusableElement(container, false, this.#acceptFilter, true);
    } else if (event.key === 'ArrowLeft' && type !== 'hour') {
      const nextContainer = container.previousElementSibling;
      next = nextContainer.querySelector('.selected') || nextContainer.children[0];
    } else if (event.key === 'ArrowRight' && type !== 'meridiem') {
      const nextContainer = container.nextElementSibling;
      next = nextContainer.querySelector('.selected') || nextContainer.children[0];
    } else if (event.key === 'Enter') {
      active.click();
    } else if (event.key === 'Escape') {
      this.hidePopover();
    }

    if (next) {
      next.focus();
      next.click();
      event.preventDefault();
    }
  }

  #acceptFilter(element) {
    return element.nodeName === 'BUTTON';
  }

  #updateScrollPositions() {
    [...this.querySelectorAll('.selected')].forEach(e => e.classList.remove('selected'));
    const hourSelected = this.shadowRoot.querySelector(`.hour[value="${this.#hour}"]`);
    if (hourSelected) {
      const hourContainer = this.shadowRoot.querySelector('.hours');
      hourSelected.classList.add('selected');
      hourContainer.scrollTop = hourSelected.offsetTop - 4;
    }
    const minuteSelected = this.shadowRoot.querySelector(`.minute[value="${this.#minute}"]`);
    if (minuteSelected) {
      const minuteContainer = this.shadowRoot.querySelector('.minutes');
      minuteSelected.classList.add('selected');
      minuteContainer.scrollTop = minuteSelected.offsetTop - 4;
    }
    const meridiemSelected = this.shadowRoot.querySelector(`.meridiem[value="${this.#meridiem}"]`);
    meridiemSelected.classList.add('selected');
  }
}
customElements.define(MCTimePickerInputElement.tag, MCTimePickerInputElement);
