import MCSurfaceElement from '../surface/index.js';
import surfaceStyles from '../surface/component.css' assert { type: 'css' };
import styles from './component.css' assert { type: 'css' };
import {
  keyboard_FILL0_wght400_GRAD0_opsz24,
  schedule_FILL0_wght400_GRAD0_opsz24
} from './../../helpers/svgs.js';
import device from './../../helpers/device.js';

// TODO landscape

class MCTimePickerElement extends MCSurfaceElement {
  static tag = 'mc-time-picker';
  static styleSheets = [surfaceStyles, styles];

  #abort;
  #showAbort;
  #textfield;
  #selector;
  #hasDisplayChange = true;
  #displayValue = '';
  #hour;
  #paddedHour;
  #paddedHour24;
  #minute;
  #paddedMinute;
  #meridiem;
  #hour24 = false;
  #hour24Touched = false;
  #view = 'hour';
  #hourData = [];
  #minuteData = [];
  #handleClose_bound = this.#handleClose.bind(this);
  #textfieldFocus_bound = this.#textfieldFocus.bind(this);
  #textfieldBlur_bound = this.#textfieldBlur.bind(this);
  #spaceInterceptor_bound = this.#spaceInterceptor.bind(this);
  #ok_bound = this.#ok.bind(this);
  #close_bound = this.close.bind(this);
  #keyboardClick_bound = this.#keyboardClick.bind(this);
  #selectMouseDown_bound = this.#selectMouseDown.bind(this);
  #selectMouseUp_bound = this.#selectMouseUp.bind(this);
  #selectMouseMove_bound = this.#selectMouseMove.bind(this);
  #amClick_bound = this.#amClick.bind(this);
  #pmClick_bound = this.#pmClick.bind(this);
  #hourClick_bound = this.#hourClick.bind(this);
  #minuteClick_bound = this.#minuteClick.bind(this);
  #inputFocus_bound = this.#inputFocus.bind(this);
  #inputBlur_bound = this.#inputBlur.bind(this);
  #inputKeydown_bound = this.#inputKeydown.bind(this);
  #onInput_bound = this.#onInput.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    this.#textfield = this.parentElement;
    this.#selector = this.shadowRoot.querySelector('.selector-container');
  }

  template() {
    return /*html*/`
      <dialog>
        <div class="headline">Select time</div>

        <div class="time-container">
          <input class="time-hour selected" aria-label="time hour" type="number">
          <div class="time-separator">:</div>
          <input class="time-minute" aria-label="time minute" type="number" min="0" max="59">

          <div class="meridiem-container">
            <div class="am" aria-label="am" tabindex="0">AM</div>
            <div class="pm" aria-label="pm" tabindex="0">PM</div>
          </div>
        </div>

        <div class="dial-container">
          <div class="dial-container-background"></div>
          <div class="dial-hour"></div>
          <div class="dial-hour-secondary"></div>
          <div class="dial-minute"></div>
          <div class="selector-container">
            <div class="selector-center"></div>
            <div class="selector-line"></div>
            <div class="selector"></div>
          </div>
        </div>

        <div class="actions">
          <mc-icon-button class="keyboard" toggle>
            <mc-icon>${keyboard_FILL0_wght400_GRAD0_opsz24}</mc-icon>
            <mc-icon slot="selected">${schedule_FILL0_wght400_GRAD0_opsz24}</mc-icon>
          </mc-icon-button>
          <span style="flex: 1"></span>
          <mc-button class="cancel">cancel</mc-button>
          <mc-button class="ok">ok</mc-button>
        </div>
      </dialog>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#abort = new AbortController();
    this.#textfield.addEventListener('focusin', this.#textfieldFocus_bound, { signal: this.#abort.signal });
    this.hour24 = this.hasAttribute('hour24') || Intl.DateTimeFormat('en-US', { hour: 'numeric' }).resolvedOptions().hour12 === false;

    const timeHour = this.shadowRoot.querySelector('input.time-hour');
    timeHour.step = this.#hourStep;
    timeHour.min = this.#hour24 ? 0 : 1;
    timeHour.max = this.#hour24 ? 23 : 12;
    const timeMinute = this.shadowRoot.querySelector('input.time-minute');
    timeMinute.step = this.#minuteStep;

    requestAnimationFrame(() => {
      if (!this.#hour24Touched) this.#hour24 = device.hourCycle === 'h24';
      this.#buildThetaData();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
    if (this.#showAbort) this.#showAbort.abort();
  }

  get hour24() { return this.#hour24; }
  set hour24(value) {
    this.#hour24Touched = true;
    this.#hour24 = !!value;
  }

  get value() {
    return this.#textfield.value;
  }
  set value(value) {
    this.#textfield.value = value;
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

  get minute() { return this.#minute; }
  set minute(value) {
    if (this.#minute !== value) this.#hasDisplayChange = true;
    this.#minute = value;
    this.#paddedMinute = value < 10 ? `0${value}` : `${value}`;
  }
  get paddedMinute() { return this.#paddedMinute; }

  get hour() { return this.#hour; }
  set hour(value) {
    this.#paddedHour24 = value < 10 ? `0${value}` : `${value}`;
    if (!this.hour24) {
      const meridiem = value > 12 ? 'PM' : 'AM';
      if (value === 0) value = 12;
      if (meridiem === 'PM') value = value - 12;

      this.meridiem = meridiem;
    }

    if (this.#hour !== value) this.#hasDisplayChange = true;
    this.#hour = value;
    this.#paddedHour = value < 10 ? `0${value}` : `${value}`;
  }
  get paddedHour() { return this.#paddedHour; }
  get paddedHour24() { return this.#paddedHour24; }

  get meridiem() { return this.#meridiem; }
  set meridiem(value) {
    const change = this.#meridiem !== value;
    this.#meridiem = value;
    if (change && !this.hour24) {
      if (value === 'PM' && this.hour < 12) this.#paddedHour24 = this.hour + 12;
      else if (value === 'AM' && this.hour > 11) this.#paddedHour24 = this.hour - 12;

      if (this.#paddedHour24.length === 1) this.#paddedHour24 = `0${this.#paddedHour24}`
    }
  }

  get view() { return this.#view; }
  set view(value) {
    if (value === 'minute' && this.#minuteData.length === 0) return;

    if (this.#view !== value) this.#hasDisplayChange = true;
    this.#view = value;
    this.#setView(value);
  }

  get #hourStep() {
    return Math.max(1, Math.floor(parseInt(this.step || 1) / 3600))
  }

  get #minuteStep() {
    const step = Math.max(1, Math.floor(parseInt(this.step || 1) / 60));
    if (step > 30) return -1;
    return step;
  }



  show() {
    this.showModal();
  }

  // show handles both states
  showModal() {
    this.classList.remove('input-view');
    super.showModal();

    this.#setInitialTime();
    this.#parseTime();
    this.view = 'hour';
    this.#updateDisplay();

    this.#showAbort = new AbortController();
    this.addEventListener('close', this.#handleClose_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.ok').addEventListener('click', this.#ok_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.cancel').addEventListener('click', this.#close_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.keyboard').addEventListener('click', this.#keyboardClick_bound, { signal: this.#showAbort.signal });

    const dialContainer = this.shadowRoot.querySelector('.dial-container');
    dialContainer.addEventListener('mousedown', this.#selectMouseDown_bound, { signal: this.#showAbort.signal });
    dialContainer.addEventListener('touchstart', this.#selectMouseDown_bound, { signal: this.#showAbort.signal });
    dialContainer.addEventListener('click', this.#selectMouseMove_bound, { signal: this.#showAbort.signal });
    const timeHour = this.shadowRoot.querySelector('.time-hour');
    timeHour.addEventListener('click', this.#hourClick_bound, { signal: this.#showAbort.signal });
    timeHour.addEventListener('focus', this.#inputFocus_bound, { signal: this.#showAbort.signal });
    const timeMinute = this.shadowRoot.querySelector('.time-minute');
    timeMinute.addEventListener('click', this.#minuteClick_bound, { signal: this.#showAbort.signal });
    timeMinute.addEventListener('focus', this.#inputFocus_bound, { signal: this.#showAbort.signal });

    if (!this.hour24) {
      const am = this.shadowRoot.querySelector('.am');
      am.addEventListener('click', this.#amClick_bound, { signal: this.#showAbort.signal });
      am.addEventListener('focus', this.#inputFocus_bound, { signal: this.#showAbort.signal });
      const pm = this.shadowRoot.querySelector('.pm');
      pm.addEventListener('click', this.#pmClick_bound, { signal: this.#showAbort.signal });
      pm.addEventListener('focus', this.#inputFocus_bound, { signal: this.#showAbort.signal });
    }

    const compact = device.state === device.COMPACT;
    this.classList.toggle('window-compact', compact);
    if (!compact) this.#inputFocus({ target: timeHour });
  }


  #handleClose() {
    if (this.#showAbort) {
      this.#showAbort.abort();
      this.#showAbort = undefined;
    }
  }

  #ok() {
    let newValue = `${this.paddedHour24}:${this.paddedMinute}`;
    let change = this.#textfield.value !== newValue;
    this.#textfield.value = newValue;
    if (this.open && change) this.dispatchEvent(new Event('change', { bubbles: true }));
    this.close();
  }

  #textfieldFocus(event) {
    this.#textfield.addEventListener('blur', this.#textfieldBlur_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#spaceInterceptor_bound, { signal: this.#abort.signal });

    // dialogs will focus back on the input after close. We want to prevent this so the dialog does not re open
    if (this.open) {
      event.preventDefault();
      return;
    }
    this.show();
  }

  #textfieldBlur() {
    this.#textfield.removeEventListener('blur', this.#textfieldBlur);
    window.removeEventListener('keydown', this.#spaceInterceptor_bound);
  }

  #spaceInterceptor(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      if (!this.open) this.show();
    }
  }

  #buildThetaData() {
    const hourStep = this.#hourStep;
    const hourCount = 12 / hourStep;

    this.#hourData = [...new Array(hourCount)].map((_, i) => {
      const hour = i === 0 ? 12 : i * hourStep;
      const paddedHour = hour < 10 ? `0${hour}` : hour;
      const theta = 30 * (i * hourStep);
      return {
        theta: `${theta}`,
        hour: hour,
        paddedHour: `${paddedHour}`
      };
    });

    if (this.#hour24) {
      this.#hourData[0].hour = 0;
      this.#hourData[0].paddedHour = '00';
      this.#hourData = this.#hourData.concat([...new Array(hourCount)].map((_, i) => {
        const hour = i === 0 ? 12 : (i * hourStep) + 12;
        const paddedHour = hour < 10 ? `0${hour}` : hour;
        const theta = 30 * (i * hourStep);
        return {
          theta: `${theta}`,
          hour: hour,
          paddedHour: `${paddedHour}`,
          is24: true
        };
      }));
    }

    const minuteStep = this.#minuteStep;
    if (minuteStep !== -1) {
      const minuteCount = 60 / minuteStep;
      this.#minuteData = [...new Array(minuteCount)].map((_, i) => {
        const minute = i * minuteStep;
        const paddedMinute = minute < 10 ? `0${minute}` : minute;
        const theta = 6 * (i * minuteStep);
        return {
          theta: `${theta}`,
          minute: minute,
          paddedMinute: `${paddedMinute}`,
          display: minute % 5 === 0
        };
      });

      const inputMinute = this.shadowRoot.querySelector('input.time-minute');

      inputMinute.disabled = false;
      inputMinute.step = minuteStep;
      inputMinute.min = this.#minuteData[0].minute;
      inputMinute.max = this.#minuteData[this.#minuteData.length - 1].minute;
    } else {
      this.shadowRoot.querySelector('input.time-minute').disabled = true;
    }

    const inputHour = this.shadowRoot.querySelector('input.time-hour');
    inputHour.step = hourStep;
    inputHour.min = this.#hour24 ? this.#hourData[0].hour : this.#hourData[1].hour;
    inputHour.max = this.#hour24 ? this.#hourData[this.#hourData.length - 1].hour : this.#hourData[0].hour;

    this.shadowRoot.querySelector('.dial-hour').innerHTML = this.#hourData.filter(v => !v.is24).map(v => `<div class="dial-label${this.hour === v.hour ? ' selected' : ''}" hour="${v.hour}" degree="${v.theta}">${v.paddedHour}</div>`).join('\n');
    this.shadowRoot.querySelector('.dial-hour-secondary').innerHTML = this.#hourData.filter(v => v.is24).map(v => `<div class="dial-label${this.hour === v.hour ? ' selected' : ''}" hour="${v.hour}" degree="${v.theta}">${v.paddedHour}</div>`).join('\n');
    this.shadowRoot.querySelector('.dial-minute').innerHTML = this.#minuteData.map(v => `<div class="dial-label${!v.display ? ' minute-hidden' : ''}${this.minute === v.minute ? ' selected' : ''}" minute="${v.minute}" degree="${v.theta}">${v.display ? v.paddedMinute : ''}</div>`).join('\n');
  }

  #setInitialTime() {
    if (this.#textfield.value) {
      this.#displayValue = this.#textfield.value;
    } else {
      const date = new Date();
      const hourStep = this.#hourStep;
      let hour = Math.round(date.getHours() / hourStep) * hourStep;
      if (hour < 10) hour = `0${hour}`;
      const minuteStep = this.#minuteStep;
      let minute = minuteStep === -1 ? 0 : Math.round(date.getMinutes() / minuteStep) * minuteStep;
      if (minute < 10) minute = `0${minute}`;
      this.#displayValue = `${hour}:${minute}`;
    }
  }

  #parseTime() {
    const split = this.#displayValue.split(':');
    let hour = parseInt(split[0]);

    if (!this.hour24) {
      if (hour > 12) hour = hour - 12;
      if (hour === 0) hour = 12;
    }

    this.hour = hour;
    this.minute = parseInt(split[1]);
  }

  #updateDisplay() {
    if (!this.#hasDisplayChange) return;
    this.#hasDisplayChange = false;

    const readonly = this.view !== 'input' && device.state === 'compact';
    const inputHour = this.shadowRoot.querySelector('input.time-hour');
    inputHour.value = this.paddedHour;
    inputHour.toggleAttribute('readonly', readonly);
    const inputMinute = this.shadowRoot.querySelector('input.time-minute');
    inputMinute.value = this.paddedMinute;
    inputMinute.toggleAttribute('readonly', readonly);

    if (this.#view === 'hour') {
      const current = this.shadowRoot.querySelector(`.dial-label[hour].selected`);
      if (current) current.classList.remove('selected');
      const next = this.shadowRoot.querySelector(`.dial-label[hour="${this.hour}"]`);
      if (next) next.classList.add('selected');
      const hourData = this.#hourData.find(v => v.hour === this.hour);
      this.#selector.style.transform = `rotate(${hourData.theta}deg)`;
      this.#selector.classList.toggle('hour-secondary', !!hourData.is24)

    } else if (this.#view === 'minute') {
      const current = this.shadowRoot.querySelector(`.dial-label[minute].selected`);
      if (current) current.classList.remove('selected');
      const next = this.shadowRoot.querySelector(`.dial-label[minute="${this.minute}"]`);
      if (next) next.classList.add('selected');
      // make selector smaller when between labels
      this.#selector.classList.toggle('minute-secondary', this.minute % 5 !== 0);
      this.#selector.style.transform = `rotate(${this.#minuteData.find(v => v.minute === this.minute).theta}deg)`;
    }

    if (!this.hour24) {
      this.shadowRoot.querySelector('.am').classList.toggle('selected', this.meridiem === 'AM');
      this.shadowRoot.querySelector('.pm').classList.toggle('selected', this.meridiem === 'PM');
    }
  }

  #keyboardClick() {
    if (this.view !== 'input') this.view = 'input';
    else {
      if (document.activeElement.nodeName === 'INPUT') document.activeElement.blur();
      this.view = 'hour';
    }
    this.#updateDisplay();
    this.shadowRoot.querySelector('input.time-hour').focus();
  }

  #amClick() {
    this.shadowRoot.querySelector('.am').classList.add('selected');
    this.shadowRoot.querySelector('.pm').classList.remove('selected');
    this.meridiem = 'AM';
  }

  #pmClick() {
    this.shadowRoot.querySelector('.pm').classList.add('selected');
    this.shadowRoot.querySelector('.am').classList.remove('selected');
    this.meridiem = 'PM';
  }

  #selectMouseDown(event) {
    const selectorBounds = this.#selector.getBoundingClientRect();
    const { x, y } = this.#getMousePosition(event);
    if (
      x < selectorBounds.x
      && x > selectorBounds.right
      && y < selectorBounds.y
      && y > selectorBounds.bottom
    ) return;

    window.addEventListener('mouseup', this.#selectMouseUp_bound, { signal: this.#abort.signal });
    window.addEventListener('mousemove', this.#selectMouseMove_bound, { signal: this.#abort.signal });
    window.addEventListener('touchend', this.#selectMouseUp_bound, { signal: this.#abort.signal });
    window.addEventListener('touchmove', this.#selectMouseMove_bound, { signal: this.#abort.signal });
    event.preventDefault();
  }

  #selectMouseUp(event) {
    window.removeEventListener('mouseup', this.#selectMouseUp_bound);
    window.removeEventListener('mousemove', this.#selectMouseMove_bound);
    window.removeEventListener('touchend', this.#selectMouseUp_bound);
    window.removeEventListener('touchmove', this.#selectMouseMove_bound);
    event.preventDefault();
  }

  #selectMouseMove(event) {
    const centerBounds = this.#selector.getBoundingClientRect();
    const mousePosition = this.#getMousePosition(event);
    const x = centerBounds.x - mousePosition.x;
    const y = centerBounds.y - mousePosition.y;
    const theta = Math.atan2(y, x) * (180 / Math.PI);

    if (this.#view === 'hour') {
      const step = this.#hourStep * 30;
      let positionTheta = theta - 90;
      if (positionTheta < 0) positionTheta = 360 + positionTheta; // normalize to all positive
      positionTheta = Math.round(positionTheta / step) * step;
      if (positionTheta === 360) positionTheta = 0;

      // in inner radius
      const isHour24 = this.hour24 && x > -80 && x < 80 && y > -80 && y < 80;
      const hourData = this.#hourData.find(v => v.theta === `${positionTheta}` && (isHour24 ? v.is24 === true : v.is24 !== true));
      this.hour = hourData.hour;

    } else if (this.#view === 'minute') {
      const step = this.#minuteStep * 6;
      let positionTheta = theta - 90;
      if (positionTheta < 0) positionTheta = 360 + positionTheta; // normalize to all positive
      const distanceFromMain = (Math.round(positionTheta / 30) * 30) - positionTheta;
      if (Math.abs(distanceFromMain) < 6) positionTheta += distanceFromMain; // favor main minutes
      positionTheta = Math.round(positionTheta / step) * step;
      if (positionTheta === 360) positionTheta = 0;
      this.minute = this.#minuteData.find(v => v.theta === `${positionTheta}`).minute;
    }

    this.#updateDisplay();
  }

  #getMousePosition(event) {
    return {
      x: event.changedTouches ? event.changedTouches[0].clientX : event.clientX,
      y: event.changedTouches ? event.changedTouches[0].clientY : event.clientY,
    }
  }

  #hourClick() {
    if (this.view === 'input') return;
    this.view = 'hour';
    this.#updateDisplay();
  }

  #minuteClick() {
    if (this.view === 'input') return;
    this.view = 'minute';
    this.#updateDisplay();
  }

  #inputFocus(event) {
    event.target.addEventListener('blur', this.#inputBlur_bound, { signal: this.#abort.signal });
    event.target.addEventListener('keydown', this.#inputKeydown_bound, { signal: this.#abort.signal })
    if (event.target.nodeName === 'INPUT') {
      event.target.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    }
  }

  #inputBlur(event) {
    event.target.removeEventListener('blur', this.#inputBlur_bound);
    event.target.removeEventListener('keydown', this.#inputKeydown_bound)
    if (event.target.nodeName === 'INPUT') {
      event.target.removeEventListener('input', this.#onInput_bound);
    }
  }

  #inputKeydown(event) {
    if (event.key === 'ArrowRight') {
      if (event.target.classList.contains('time-hour')) {
        this.shadowRoot.querySelector('input.time-minute').focus();
        if (this.view === 'hour') {
          this.view = 'minute';
          this.#updateDisplay();
        }
      } else if (event.target.classList.contains('time-minute')) {
        this.shadowRoot.querySelector('.am').focus();
      } else if (event.target.classList.contains('am')) {
        this.shadowRoot.querySelector('.pm').focus();
      }
    } else if (event.key === 'ArrowLeft') {
      if (event.target.classList.contains('time-minute')) {
        this.shadowRoot.querySelector('input.time-hour').focus();
        if (this.view === 'minute') {
          this.view = 'hour';
          this.#updateDisplay();
        }
      } else if (event.target.classList.contains('am')) {
        this.shadowRoot.querySelector('input.time-minute').focus();
        if (this.view === 'hour') {
          this.view = 'minute';
          this.#updateDisplay();
        }
      } else if (event.target.classList.contains('pm')) {
        this.shadowRoot.querySelector('.am').focus();
      }
    } else if (event.key === 'ArrowUp') {
      if (event.target.classList.contains('am')) {
        this.shadowRoot.querySelector('input.time-minute').focus();
        if (this.view === 'hour') {
          this.view = 'minute';
          this.#updateDisplay();
        }
      } else if (event.target.classList.contains('pm')) {
        this.shadowRoot.querySelector('.am').focus();
      }
      if (event.target.nodeName !== 'INPUT') {
        event.preventDefault();
        event.stopPropagation();
      }
    } else if (event.key === 'ArrowDown') {
      if (event.target.classList.contains('am')) {
        this.shadowRoot.querySelector('.pm').focus();
      }
      if (event.target.nodeName !== 'INPUT') {
        event.preventDefault();
        event.stopPropagation();
      }
    } else if (event.key === 'Enter') {
      if (event.target.classList.contains('am')) {
        event.target.click();
      } else if (event.target.classList.contains('pm')) {
        event.target.click();
      } else {
        this.#ok();
      }
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  #onInput(event) {
    if (event.target.classList.contains('time-hour')) {
      const value = parseInt(event.target.value);
      if (value !== this.hour) {
        this.hour = value;
        if (this.view === 'hour') this.#updateDisplay();
      }
    }

    if (event.target.classList.contains('time-minute')) {
      const value = parseInt(event.target.value);
      if (value !== this.minute) {
        this.minute = value;
        if (this.view === 'minute') this.#updateDisplay();
      }
    }
  }

  #setView(view = 'hour') {
    this.classList.remove('hour-view');
    this.classList.remove('minute-view');
    this.classList.remove('input-view');
    this.shadowRoot.querySelector('.selector').classList.remove('secondary');

    if (view === 'hour') {
      this.classList.add('hour-view');
      this.shadowRoot.querySelector('.time-hour').classList.add('selected');
      this.shadowRoot.querySelector('.time-minute').classList.remove('selected');

    } else if (view === 'minute') {
      this.classList.add('minute-view');
      this.shadowRoot.querySelector('.time-minute').classList.add('selected');
      this.shadowRoot.querySelector('.time-hour').classList.remove('selected');

    } else if (view === 'input') {
      this.classList.add('input-view');
    }
  }
}
customElements.define(MCTimePickerElement.tag, MCTimePickerElement);
