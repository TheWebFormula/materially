import MCSurfaceElement from '../surface/index.js';
import surfaceStyles from '../surface/component.css' assert { type: 'css' };
import styles from './date-picker.css' assert { type: 'css' };
import {
  check_FILL1_wght400_GRAD0_opsz24,
  arrow_drop_down_FILL1_wght400_GRAD0_opsz24,
  chevron_left_FILL1_wght400_GRAD0_opsz24,
  edit_FILL1_wght400_GRAD0_opsz24,
  calendar_today_FILL0_wght400_GRAD0_opsz24
} from '../../helpers/svgs.js';
import device from '../../helpers/device.js';
import { monthDaysTemplate } from './helper.js';
import util from '../../helpers/util.js';
import Swipe from '../../helpers/Swipe.js';
import dateUtil from '../../helpers/date.js';

// TODO keyboard controls

class MCDatePickerElement extends MCSurfaceElement {
  static tag = 'mc-date-picker';
  static styleSheets = [surfaceStyles, styles];

  #abort;
  #showAbort;
  #textfield;
  #displayDate;
  #selectedDate;
  #initialTextFieldValue;
  #view;
  #swipe;
  #isNextDrag = false;
  #nextDragDate;
  #previousDragDate;
  #dirty = false;
  #updateDate_bound = this.#updateDate.bind(this);
  #nextMonth_bound = this.#nextMonth.bind(this);
  #previousMonth_bound = this.#previousMonth.bind(this);
  #dayClick_bound = this.#dayClick.bind(this);
  #yearSelectClick_bound = this.#yearSelectClick.bind(this);
  #monthSelectClick_bound = this.#monthSelectClick.bind(this);
  #monthListClick_bound = this.#monthListClick.bind(this);
  #yearListClick_bound = this.#yearListClick.bind(this);
  #okClick_bound = this.#okClick.bind(this);
  #cancelClick_bound = this.#cancelClick.bind(this);
  #clearClick_bound = this.#clearClick.bind(this);
  #nextYear_bound = this.#nextYear.bind(this);
  #previousYear_bound = this.#previousYear.bind(this);
  #toggleInputView_bound = this.#toggleInputView.bind(this);
  #spaceInterceptor_bound = this.#spaceInterceptor.bind(this);
  #onInputView_bound = this.#onInputView.bind(this);
  #swipeStart_bound = this.#swipeStart.bind(this);
  #swipeEnd_bound = this.#swipeEnd.bind(this);
  #swipeMove_bound = this.#swipeMove.bind(this);
  #toggle_bound = this.#toggle.bind(this);
  #clickOutside_bound = this.#clickOutside.bind(this);
  #escClose_bound = this.#escClose.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    this.ariaLabel = 'date picker';
    this.preventClose = true;
    this.#textfield = this.parentElement;
    this.anchor = this.#textfield;
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="container">
        <div class="controls">
          <div class="control-group">
            <div class="month-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
            <div class="month-select">
              <div class="month-select-label"></div>
              <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
            </div>
            <div class="month-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
          </div>
          
          <div class="control-group">
            <div class="year-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
            <div class="year-select">
              <div class="year-select-label"></div>
              <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
            </div>
            <div class="year-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
          </div>
        </div>

        <div class="month-days-container">
          <div class="week-header">
            ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
          </div>

          <div class="days-container active"></div>
          <div class="days-container"></div>
        </div>

        <div class="modal-header">
          <div class="select-date">Select date</div>
          <div class="display-date-container">
            <div class="display-date"></div>
            <div class="display-date-input">Enter dates</div>

            <mc-icon-button toggle aria-label="Input edit">
              <mc-icon>${edit_FILL1_wght400_GRAD0_opsz24}</mc-icon>
              <mc-icon slot="selected">${calendar_today_FILL0_wght400_GRAD0_opsz24}</mc-icon>
            </mc-icon-button>
          </div>

          <div class="divider"></div>
          
          <mc-textfield label="Date" type="date" class="outlined hide-date-icon"></mc-textfield>
        </div>

        <div class="month-days-container-modal">
          <div class="days-container-modal active">
            <div class="days-controls">
              <div class="year-select">
                <div class="month-select-label"></div>
                <div class="year-select-label"></div>
                <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
              </div>

              <div class="month-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
              <div class="month-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
            </div>
            <div class="week-header">
              ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
            </div>
            <div class="days-inner"></div>
          </div>

          <div class="days-container-modal">
            <div class="days-controls">
              <div class="year-select">
                <div class="month-select-label"></div>
                <div class="year-select-label"></div>
                <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
              </div>

              <div class="month-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
              <div class="month-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
            </div>
            <div class="week-header">
              ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
            </div>
            <div class="days-inner"></div>
          </div>
        </div>

        <div class="actions">
          <mc-button class="clear">Clear</mc-button>

          <mc-button class="cancel">Cancel</mc-button>
          <mc-button class="ok">OK</mc-button>
        </div>

        <div class="month-list">${dateUtil.getMonthNames().map((name, i) => `
          <div class="month-item" month="${i + 1}">
            <mc-icon>${check_FILL1_wght400_GRAD0_opsz24}</mc-icon>
            ${name}
          </div>
        `).join('')}</div>
        <div class="year-list">${dateUtil.defaultYearRange().map(year => `
          <div class="year-item" year="${year}">
            ${year}
          </div>
        `).join('')}</div>
      </div>
    `;
  }


  connectedCallback() {
    super.connectedCallback();
    this.#abort = new AbortController();
    this.addEventListener('toggle', this.#toggle_bound, { signal: this.#abort.signal });
    window.addEventListener('mcwindowstatechange', this.#windowStateChange_bound, { signal: this.#abort.signal });
    this.displayDate = dateUtil.parse(this.#textfield.value || dateUtil.today());
    this.#windowStateChange();
    this.#swipe = new Swipe(this, { horizontalOnly: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
    if (this.#showAbort) {
      this.#showAbort.abort();
      this.#showAbort = undefined;
    }
    if (this.#swipe) this.#swipe.destroy();
  }


  get displayDate() { return this.#displayDate; }
  set displayDate(value) {
    this.#displayDate = value;
  }

  get selectedDate() { return this.#selectedDate; }
  set selectedDate(value) {
    this.#dirty = this.open && this.#selectedDate !== value;
    this.#selectedDate = value;
    this.#textfield.value = this.#selectedDate ? dateUtil.format(this.#selectedDate, 'YYYY-MM-dd') : '';
  }

  get minDate() {
    return dateUtil.parse(this.#textfield.min);
  }
  get maxDate() {
    return dateUtil.parse(this.#textfield.max);
  }

  get view() { return this.#view; }
  set view(value) {
    this.#view = value;
    this.classList.toggle('view-month', value === 'month');
    this.classList.toggle('view-year', value === 'year');
    if (value === 'month') {
      const month = this.shadowRoot.querySelector('.month-item.selected');
      if (month) {
        const list = this.shadowRoot.querySelector('.month-list');
        list.scrollTop = (list.offsetHeight / 2) + ((month.offsetTop + month.offsetHeight) - list.offsetHeight);
      }
    }
    if (value === 'year') {
      const year = this.shadowRoot.querySelector('.year-item.selected');
      if (year) {
        const list = this.shadowRoot.querySelector('.year-list');
        list.scrollTop = (list.offsetHeight / 2) + ((year.offsetTop + year.offsetHeight) - list.offsetHeight);
      }
    }
  }


  #toggle(event) {
    if (event.newState === 'open') {
      this.#show();
    } else {
      this.#hide();
    }
  }

  // TODO reset option from filter?
  #show() {
    this.#dirty = false;
    this.classList.remove('input-view');


    this.#initialTextFieldValue = this.#textfield.value;
    this.#updateDate();

    this.#showAbort = new AbortController();

    this.#textfield.addEventListener('input', this.#updateDate_bound, { signal: this.#showAbort.signal });
    this.#getMonthNext().addEventListener('click', this.#nextMonth_bound, { signal: this.#showAbort.signal });
    this.#getMonthPrevious().addEventListener('click', this.#previousMonth_bound, { signal: this.#showAbort.signal });
    this.#getMonthDaysContainer().addEventListener('click', this.#dayClick_bound, { signal: this.#showAbort.signal, capture: true });
    this.#getYearSelect().addEventListener('click', this.#yearSelectClick_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.month-list').addEventListener('click', this.#monthListClick_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.year-list').addEventListener('click', this.#yearListClick_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.cancel').addEventListener('click', this.#cancelClick_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.ok').addEventListener('click', this.#okClick_bound, { signal: this.#showAbort.signal });
    if (this.clear) this.shadowRoot.querySelector('.clear').addEventListener('click', this.#clearClick_bound, { signal: this.#showAbort.signal });

    if (!this.modal) {
      this.shadowRoot.querySelector('.year-next').addEventListener('click', this.#nextYear_bound, { signal: this.#showAbort.signal });
      this.shadowRoot.querySelector('.year-previous').addEventListener('click', this.#previousYear_bound, { signal: this.#showAbort.signal });
      this.shadowRoot.querySelector('.month-select').addEventListener('click', this.#monthSelectClick_bound, { signal: this.#showAbort.signal });
      window.addEventListener('click', this.#clickOutside_bound, { signal: this.#showAbort.signal });
      window.addEventListener('keydown', this.#escClose_bound, { signal: this.#showAbort.signal });
    } else {
      this.#getMonthNext(false).addEventListener('click', this.#nextMonth_bound, { signal: this.#showAbort.signal });
      this.#getMonthPrevious(false).addEventListener('click', this.#previousMonth_bound, { signal: this.#showAbort.signal });
      this.#getYearSelect(false).addEventListener('click', this.#yearSelectClick_bound, { signal: this.#showAbort.signal });
      this.shadowRoot.querySelector('.display-date-container').addEventListener('click', this.#toggleInputView_bound, { signal: this.#showAbort.signal });
      this.#swipe.enable();
      this.addEventListener('swipestart', this.#swipeStart_bound, { signal: this.#showAbort.signal });
      this.addEventListener('swipeend', this.#swipeEnd_bound, { signal: this.#showAbort.signal });
      this.addEventListener('swipemove', this.#swipeMove_bound, { signal: this.#showAbort.signal });
    }

    this.#textfield.addEventListener('keydown', this.#spaceInterceptor_bound, { signal: this.#showAbort.signal });
  }

  #hide() {
    if (this.#showAbort) {
      this.#showAbort.abort();
      this.#showAbort = undefined;
    }
    if (this.modal) {
      setTimeout(() => {
        this.#textfield.blur();
      });
    }
    if (this.#swipe) this.#swipe.disable();
  }


  #updateDate() {
    this.displayDate = dateUtil.parse(this.#textfield.value || dateUtil.today());
    // update internal selected date to prevent loop
    if (this.#textfield.value) this.#selectedDate = dateUtil.parse(this.#textfield.value);
    else this.#selectedDate = undefined;
    this.#changeDate({ force: true, noAnimation: true });
  }

  async #changeDate(params = { force: false, noAnimation: false }) {
    const daysContainerAnimatableActive = this.#getDaysContainerAnimatable();
    let monthToBeActive = daysContainerAnimatableActive;

    // grab date from day. Make sure it is not previous month (nth-child)
    const activeDisplayParts = dateUtil.getParts(dateUtil.parse(daysContainerAnimatableActive.querySelector('[date]:nth-child(10)').getAttribute('date')));
    const displayDateParts = dateUtil.getParts(this.displayDate);

    // update your / month display
    if (params.force || activeDisplayParts.year !== displayDateParts.year || activeDisplayParts.month !== displayDateParts.month) {
      const daysContainerAnimatable = this.#getDaysContainerAnimatable(false);
      monthToBeActive = daysContainerAnimatable;
      if (this.modal) {
        daysContainerAnimatable.querySelector('.days-inner').innerHTML = monthDaysTemplate(this.displayDate, this.minDate, this.maxDate);
      } else {
        daysContainerAnimatable.innerHTML = monthDaysTemplate(this.displayDate, this.minDate, this.maxDate);
      }

      this.#getYearsSelectLabel(false).innerHTML = displayDateParts.year;
      this.#getMonthSelectLabel(false).innerHTML = dateUtil.format(this.displayDate, 'MMMM');

      if (params.noAnimation) {
        daysContainerAnimatable.classList.add('active');
        daysContainerAnimatableActive.classList.remove('active');
      } else {
        const direction = displayDateParts.year < activeDisplayParts.year ? -1 : displayDateParts.year > activeDisplayParts.year ? 1 : activeDisplayParts.month < displayDateParts.month ? 1 : -1;
        if (direction === 1) {
          daysContainerAnimatable.classList.add('animate-next');
          daysContainerAnimatableActive.classList.add('animate-next');
        } else {
          daysContainerAnimatable.classList.add('animate-previous');
          daysContainerAnimatableActive.classList.add('animate-previous');
        }

        util.animationendAsync(daysContainerAnimatableActive).finally(() => {
          daysContainerAnimatable.classList.remove('animate-next');
          daysContainerAnimatableActive.classList.remove('animate-next');
          daysContainerAnimatable.classList.remove('animate-previous');
          daysContainerAnimatableActive.classList.remove('animate-previous');
          daysContainerAnimatable.classList.add('active');
          daysContainerAnimatableActive.classList.remove('active');
        });
      }
    }


    const selectedDay = this.#getDaysContainer().querySelector('.day.interactive.selected');
    if (selectedDay) selectedDay.classList.remove('selected');
    const selectedMonth = this.shadowRoot.querySelector('.month-item.selected');
    if (selectedMonth) selectedMonth.classList.remove('selected');
    const selectedYear = this.shadowRoot.querySelector('.year-item.selected');
    if (selectedYear) selectedYear.classList.remove('selected');
    if (this.modal) this.shadowRoot.querySelector('.modal-header .display-date').textContent = dateUtil.format(this.selectedDate || dateUtil.today(), 'ddd, MMM DD');

    if (this.selectedDate) {
      const selectedParts = dateUtil.getParts(this.selectedDate);

      if (selectedParts.year === displayDateParts.year && selectedParts.month === displayDateParts.month) {
        const next = monthToBeActive.querySelector(`.day.interactive[day="${selectedParts.day}"]`);
        if (next) next.classList.add('selected');
      }
      const newMonth = this.shadowRoot.querySelector(`.month-item[month="${selectedParts.month}"]`);
      if (newMonth) newMonth.classList.add('selected');
      const newYear = this.shadowRoot.querySelector(`.year-item[year="${selectedParts.year}"]`);
      if (newYear) newYear.classList.add('selected');
    } else {
      const newMonth = this.shadowRoot.querySelector(`.month-item[month="${displayDateParts.month}"]`);
      if (newMonth) newMonth.classList.add('selected');
      const newYear = this.shadowRoot.querySelector(`.year-item[year="${displayDateParts.year}"]`);
      if (newYear) newYear.classList.add('selected');
    }
  }


  #nextYear() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { year: 1 }
    );
    this.#changeDate();
  }

  #previousYear() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { year: -1 }
    );
    this.#changeDate();
  }

  #cancelClick() {
    this.#textfield.value = this.#initialTextFieldValue;
    this.hidePopover();
  }

  #okClick() {
    if (this.#dirty) {
      this.dispatchEvent(new Event('change', { bubbles: true }));
      this.#dirty = false;
    }
    this.hidePopover();
  }

  #clearClick() {
    this.displayDate = dateUtil.parse(dateUtil.today());
    const change = !!this.#selectedDate;
    this.selectedDate = undefined;
    this.#changeDate();
    if (this.open && change) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #monthListClick(event) {
    this.displayDate = dateUtil.setDateByParts(
      this.#displayDate,
      { month: parseInt(event.target.getAttribute('month')) }
    );
    if (this.selectedDate) this.selectedDate = this.displayDate;
    this.#changeDate();
    setTimeout(() => {
      this.view = 'day';
    }, 50);
  }

  #yearListClick(event) {
    this.displayDate = dateUtil.setDateByParts(
      this.#displayDate,
      { year: parseInt(event.target.getAttribute('year')) }
    );
    if (this.selectedDate) this.selectedDate = this.displayDate;
    this.#changeDate();
    setTimeout(() => {
      this.view = 'day';
    }, 50);
  }

  #monthSelectClick() {
    if (this.view !== 'month') this.view = 'month';
    else this.view = 'day';
  }

  #yearSelectClick() {
    if (this.view !== 'year') this.view = 'year';
    else this.view = 'day';
  }

  #dayClick(event) {
    const target = event.composedPath()[0];
    if (!target.classList.contains('day')) return;
    this.selectedDate = dateUtil.parse(target.getAttribute('date'));
    this.#changeDate();
  }

  #nextMonth() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: 1 }
    );
    this.#changeDate();
  }

  #previousMonth() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: -1 }
    );
    this.#changeDate();
  }

  async #toggleInputView() {
    const isInputView = this.classList.contains('input-view');
    this.classList.add('animate-view');
    this.classList.toggle('input-view');
    const input = this.shadowRoot.querySelector('.modal-header mc-textfield');
    if (!isInputView) {
      input.value = this.selectedDate ? dateUtil.format(this.selectedDate, 'YYYY-MM-dd') : '';
      input.focus();
      input.addEventListener('input', this.#onInputView_bound, { signal: this.#showAbort.signal });
    } else {
      input.removeEventListener('input', this.#onInputView_bound);
    }

    await util.transitionendAsync(this);
    this.classList.remove('animate-view');
  }

  #onInputView(event) {
    const input = event.target;
    this.displayDate = dateUtil.parse(input.value || dateUtil.today());
    if (input.value) {
      this.selectedDate = dateUtil.parse(input.value);
    } else {
      this.selectedDate = undefined;
    }
    this.#changeDate({ force: true, noAnimation: true });
  }

  #spaceInterceptor(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      if (!this.open) this.show();
    }
  }

  #escClose(event) {
    if (event.key === 'Escape' && this.matches(':popover-open')) {
      this.hidePopover();
    }
  }


  #getDaysContainer(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .days-inner');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .days-inner');
    } else {
      if (active) return this.shadowRoot.querySelector('.days-container.active');
      return this.shadowRoot.querySelector('.days-container:not(.active)');
    }
  }

  #getDaysContainerAnimatable(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active)');
    } else {
      if (active) return this.shadowRoot.querySelector('.days-container.active');
      return this.shadowRoot.querySelector('.days-container:not(.active)');
    }
  }

  #getMonthDaysContainer() {
    if (this.modal) {
      return this.shadowRoot.querySelector('.month-days-container-modal');
    } else {
      return this.shadowRoot.querySelector('.month-days-container');
    }
  }

  #getYearsSelectLabel(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .year-select-label');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .year-select-label');
    } else {
      return this.shadowRoot.querySelector('.year-select-label');
    }
  }

  #getMonthSelectLabel(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .month-select-label');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .month-select-label');
    } else {
      return this.shadowRoot.querySelector('.month-select-label');
    }
  }

  #getMonthNext(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .month-next');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .month-next');
    } else {
      return this.shadowRoot.querySelector('.month-next');
    }
  }

  #getMonthPrevious(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .month-previous');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .month-previous');
    } else {
      return this.shadowRoot.querySelector('.month-previous');
    }
  }

  #getYearSelect(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .year-select');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .year-select');
    } else {
      return this.shadowRoot.querySelector('.year-select');
    }
  }

  #swipeStart() {
    this.#isNextDrag = false;
    this.#nextDragDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: 1 }
    );
    this.#previousDragDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: -1 }
    );
  }

  async #swipeEnd(event) {
    const active = this.#getDaysContainerAnimatable(true);
    const alt = this.#getDaysContainerAnimatable(false);
    
    // TODO fix this. Accounts for some weird behavior with quick swipes and small distanceX
    if (Math.abs(event.distanceX) <= 46) {
      active.style.left = '';
      alt.style.left = '';

      if (event.swipe) {
        if (event.distanceX < 0) {
          this.#nextMonth();
        } else {
          this.#previousMonth();
        }
      }
      return;
    }

    const container = this.shadowRoot.querySelector('.month-days-container-modal');
    container.classList.add('animate-dragend');
    if (event.swipe || Math.abs(event.distanceX) > (296 / 2)) {
      if (event.distanceX < 0) {
        this.displayDate = this.#nextDragDate;
        this.#changeDate({ noAnimation: true });
        active.style.left = '-100%';
        alt.style.left = `0`;
      } else {
        this.displayDate = this.#previousDragDate;
        this.#changeDate({ noAnimation: true });
        active.style.left = '100%';
        alt.style.left = `0`;
      }
    } else {

      if (event.distanceX < 0) {
        active.style.left = '0';
        alt.style.left = '100%';
      } else {
        active.style.left = '0';
        alt.style.left = '-100%';
      }
    }

    await util.transitionendAsync(active);
    container.classList.remove('animate-dragend');
    active.style.left = '';
    alt.style.left = '';
  }

  #swipeMove(event) {
    const active = this.#getDaysContainerAnimatable(true);
    const alt = this.#getDaysContainerAnimatable(false);

    // left
    if (event.distanceX <= 0) {
      if (this.#isNextDrag !== true) {
        alt.querySelector('.days-inner').innerHTML = monthDaysTemplate(this.#nextDragDate, this.minDate, this.maxDate);
        this.#getYearsSelectLabel(false).innerHTML = this.#nextDragDate.getFullYear();
        this.#getMonthSelectLabel(false).innerHTML = dateUtil.format(this.#nextDragDate, 'MMMM');
        this.#isNextDrag = true;
      }
      active.style.left = `${event.distanceX}px`;
      alt.style.left = `calc(100% + ${event.distanceX}px)`;

      // right
    } else {
      if (this.#isNextDrag !== false) {
        alt.querySelector('.days-inner').innerHTML = monthDaysTemplate(this.#previousDragDate, this.minDate, this.maxDate);
        this.#getYearsSelectLabel(false).innerHTML = this.#previousDragDate.getFullYear();
        this.#getMonthSelectLabel(false).innerHTML = dateUtil.format(this.#previousDragDate, 'MMMM')
        this.#isNextDrag = false;
      }

      active.style.left = `${event.distanceX}px`;
      alt.style.left = `calc(-100% + ${event.distanceX}px)`;
    }
  }

  #clickOutside(event) {
    if (this.contains(event.target) || this.#textfield === event.target || this.#textfield.contains(event.target)) {
      return;
    }
    this.hidePopover();
  }

  #windowStateChange() {
    switch (device.state) {
      case device.COMPACT:
        this.modal = true;
        break;
      default:
        this.modal = false;
    }

    this.#getDaysContainer().innerHTML = monthDaysTemplate(this.#displayDate, this.minDate, this.maxDate);
    this.#getYearsSelectLabel().innerHTML = this.displayDate.getFullYear();
    this.#getMonthSelectLabel().innerHTML = dateUtil.format(this.displayDate, 'MMMM');
  }
}
customElements.define(MCDatePickerElement.tag, MCDatePickerElement);
