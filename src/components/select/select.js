import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import fuzzySearch from '../../helpers/fuzzySearch.js'
import '../textfield/index.js';
import '../menu/index.js';

// TODO aria role. seems dialog is causing issues

class MCSelectElement extends HTMLComponentElement {
  static tag = 'mc-select';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];
  static formAssociated = true;


  #abort;
  #internals;
  #input;
  #textfield;
  #menu;
  #value = '';
  #options = [];
  #initialOptions = [];
  #label = '';
  #dirty = false;
  #touched = false;
  #isFilter = false;
  #isAsync = false;
  #previousFocusOption;
  // #lastOptionsOnSelect = '';

  #onKeyDown_bound = this.#onKeyDown.bind(this);
  #preventContextMenuClose_bound = this.#preventContextMenuClose.bind(this);
  #optionClick_bound = this.#optionClick.bind(this);
  #rightClick_bound = this.#rightClick.bind(this);
  #filterInput_bound = this.#filterInput.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);
  #toggle_bound = this.#toggle.bind(this);
  #clickOutside_bound = this.#clickOutside.bind(this);


  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.render();
    this.#textfield = this.shadowRoot.querySelector('mc-textfield');
    this.#input = this.#textfield.shadowRoot.querySelector('input');
    this.#menu = this.shadowRoot.querySelector('mc-menu');
    this.#menu.anchor = this.#textfield;
    this.#menu.role = 'listbox';

    this.#isFilter = this.hasAttribute('filter');
    this.#isAsync = this.hasAttribute('async');

    this.#textfield.label = this.label;
    if (this.classList.contains('outlined')) this.#textfield.classList.add('outlined');
    if (this.hasAttribute('placeholder')) this.#textfield.setAttribute('placeholder', this.getAttribute('placeholder'));
    if (this.hasAttribute('required')) this.#textfield.setAttribute('required', '');
    if (this.#isFilter) {
      this.#textfield.setAttribute('incremental', '');
      this.#textfield.setAttribute('type', 'search');
    } else {
      this.#input.readOnly = true;
    }
    if (this.hasAttribute('supporting-text')) {
      this.#textfield.setAttribute('supporting-text', this.getAttribute('supporting-text'));
    }
  }

  template() {
    return /*html*/`
      <div class="select">
        <mc-textfield>
          <slot slot="leading-icon" name="leading-icon"></slot>
          <slot slot="trailing-icon" name="trailing-icon">
            <svg height="5" viewBox="7 10 10 5" focusable="false" class="drop-arrow">
              <polygon
                class="down"
                stroke="none"
                fill-rule="evenodd"
                points="7 10 12 15 17 10"></polygon>
              <polygon
                class="up"
                stroke="none"
                fill-rule="evenodd"
                points="7 15 12 10 17 15"></polygon>
            </svg>
          </slot>
        </mc-textfield>

        <span class="focus-holder" tabIndex="0"></span>


        <mc-menu prevent-close>
          <mc-progress-linear indeterminate disabled></mc-progress-linear>
          <slot class="options-container"></slot>
          <div class="no-results">No items</div>
        </mc-menu>
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['disabled', 'boolean'],
      ['label', 'string'],
      ['readonly', 'boolean'],
      ['supporting-text', 'string'],
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    if (name === 'value' && this.#dirty) return;
    this[name] = newValue;
  }


  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    const selected = this.#options.filter(el => el.selected = el.value === value);
    if (selected.length > 0) this.#textfield.value = selected[0].displayValue;
    this.#internals.setFormValue(this.value);
  }

  get displayValue() { return this.#textfield.value || ''; }

  get label() { return this.#label || (this.getAttribute('label') || ''); }
  set label(value) {
    this.#label = value;
    if (!this.ariaLabel) this.ariaLabel = this.#label;
    this.#textfield.label = this.#label;
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    this.toggleAttribute('required', value);
    this.#textfield.toggleAttribute('required', value);
  }

  get supportingText() { return this.hasAttribute('supporting-text'); }
  set supportingText(value) {
    this.toggleAttribute('supporting-text', value);
    this.#textfield.toggleAttribute('supporting-text', value);
  }

  get validationMessage() { return this.#textfield.validationMessage; }
  get validity() { return this.#textfield.validity; }
  get willValidate() { return this.#textfield.willValidate; }


  clear() {
    this.#dirty = false;
    this.value = '';
  }

  reset() {
    this.#dirty = false;
    this.#touched = false;
    this.#textfield.reset();
    this.#setInitialValue();
    this.#updateValidity();
  }
  formResetCallback() {
    this.#dirty = false;
    this.#touched = false;
    this.#textfield.formResetCallback();
    this.#setInitialValue();
    this.#updateValidity();
  }

  checkValidity() { return this.#textfield.checkValidity(); }
  reportValidity() {
    return this.#textfield.reportValidity();
  }
  setCustomValidity(value = '') {
    this.#textfield.setCustomValidity(value);
  }

  connectedCallback() {
    this.#abort = new AbortController();

    this.#options = [...this.querySelectorAll('mc-option')];
    this.addEventListener('mousedown', this.#rightClick_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.options-container').addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });

    requestAnimationFrame(() => {
      this.#setInitialValue();
      this.#internals.setValidity(this.#textfield.validity, this.#textfield.validationMessage, this.#textfield);
    });

    this.#menu.addEventListener('toggle', this.#toggle_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }


  setOptions(options = [{ label: 'label_text', value: 'label_value' }]) {
    if (arguments.length === 0 || !Array.isArray(options)) options = [];

    [...this.querySelectorAll('mc-option')].forEach(o => this.removeChild(o));
    this.insertAdjacentHTML('beforeend', options.map(option => `<mc-option value="${option.value}">${option.label}</mc-option>`).join(''));
  }

  initialOptions() {
    [...this.querySelectorAll('mc-option')].forEach(o => this.removeChild(o));
    this.insertAdjacentHTML('beforeend', this.#initialOptions);
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
    this.#menu.style.minWidth = `${this.offsetWidth}px`;
    window.addEventListener('click', this.#clickOutside_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#onKeyDown_bound, { signal: this.#abort.signal });
    this.#menu.addEventListener('click', this.#optionClick_bound, { signal: this.#abort.signal });
    this.#textfield.classList.add('raise-label');
    this.ariaExpanded = true;

    if (this.#isFilter) {
      this.#textfield.addEventListener('input', this.#filterInput_bound, { signal: this.#abort.signal });
    } else {
      let focusItem = this.querySelector('mc-option.selected') || this.querySelector('mc-option');
      focusItem.focus();
    }
  }

  #hide() {
    window.removeEventListener('click', this.#clickOutside_bound);
    window.removeEventListener('keydown', this.#onKeyDown_bound);
    this.#menu.removeEventListener('click', this.#optionClick_bound);

    if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
      this.#dirty = false;
    }

    if (this.#isFilter) {
      this.#textfield.removeEventListener('input', this.#filterInput_bound);
      this.value = this.value;
    }
    this.#textfield.classList.toggle('raise-label', !!this.value);
    this.ariaExpanded = false;
  }

  #clickOutside(event) {
    if (this.contains(event.target)) return;
    this.#menu.hidePopover();
  }

  #onKeyDown(event) {
    const firstOption = this.querySelector('mc-option');

    // move from first option to select input
    if (
      event.key === 'ArrowUp'
      && document.activeElement === firstOption
      && this.#previousFocusOption === firstOption
    ) {
      this.#textfield.focus();
      event.stopImmediatePropagation();
      event.preventDefault();

    // move from select input to first option
    } else if (
      firstOption
      && (
        (event.key === 'ArrowDown' && document.activeElement === this)
        || (event.key === 'Tab' && document.activeElement.nodeName !== 'MC-OPTION')
      )
    ) {
      firstOption.focus();
      event.stopImmediatePropagation();
      event.preventDefault();

    } else if (event.key === 'Enter') {

      if (document.activeElement.nodeName === 'MC-OPTION') document.activeElement.click();
      else if (this.#isFilter) {
        let firstOption = this.querySelector('mc-option');
        if (firstOption) firstOption.click();
      }
    } else if (event.key === 'Escape' && this.#menu.matches(':popover-open')) {
      this.#menu.hidePopover();
    }

    setTimeout(() => {
      this.#previousFocusOption = document.activeElement;
    });
  }

  #preventContextMenuClose(event) {
    this.popoverTargetElement.style.minWidth = `${this.offsetWidth}px`;
    this.popoverTargetElement.togglePopover();
    event.preventDefault();
    document.removeEventListener('pointerup', this.#preventContextMenuClose_bound);
  }

  #setInitialValue() {
    // get value from mc-option[selected] if no mc-select[value] exists
    const selected = this.#options.filter(el => el.hasAttribute('selected'));
    if (selected.length !== 0) this.value = selected[0].value;
    else this.value = this.getAttribute('value') ?? '';
  }

  #optionClick(event) {
    if (event.target.nodeName !== 'MC-OPTION') return;
    // this.#lastOptionsOnSelect = this.#options.map(o => o.outerHTML).join('');
    this.#dirty = true;
    this.value = event.target.value;
    this.#updateValidity();
    this.dispatchEvent(new Event('change', {bubbles: true}));
  }

  #updateValidity() {
    this.#touched = true;
    this.#internals.setFormValue(this.value);
    this.#textfield.updateValidity();
    this.#internals.setValidity(this.#textfield.validity, this.#textfield.validationMessage, this.#textfield);
  }

  #updateValidityDisplay() {
    this.#textfield.reportValidity();
  }

  // prevent focus on right click
  #rightClick(event) {
    if (event.which !== 3) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  #filterInput() {
    if (!this.#isAsync) this.#filterInputSync();
    else this.#filterInputAsync();
  }

  #filterInputSync() {
    const terms = this.#textfield.value.trim();
    if (!terms) {
      this.#textfield.suggestion = '';
      this.#options.forEach(el => {
        el.classList.remove('filtered');
        el.style.order = '';
      });
      this.shadowRoot.querySelector('mc-menu').classList.remove('filter-no-results');
      return;
    }

    const filtered = fuzzySearch(terms, this.#options.map(element => ({ element, label: element.displayValue.toLowerCase(), value: element.value })));
    this.#options.forEach(el => {
      el.classList.add('filtered');
      el.style.order = '';
    });
    filtered.forEach(({ element }, i) => {
      element.classList.remove('filtered');
      element.style.order = i;
    });

    const hasResults = filtered.length > 0;
    this.shadowRoot.querySelector('mc-menu').classList.toggle('filter-no-results', !hasResults);

    if (hasResults) {
      const regex = new RegExp(`^${terms}`, 'i');
      if (filtered[0].label.match(regex) === null) {
        this.#textfield.suggestion = '';
      } else {
        this.#textfield.suggestion = filtered[0].label;
      }
    } else {
      this.#textfield.suggestion = '';
    }
  }

  #filterInputAsync() {
    this.classList.add('filter-async-active');
    this.shadowRoot.querySelector('mc-progress-linear').removeAttribute('disabled');
  }

  #slotChange() {
    if (this.#isAsync) {
      this.classList.remove('filter-async-active');
      this.shadowRoot.querySelector('mc-progress-linear').setAttribute('disabled', '');
    }
    this.#options = [...this.querySelectorAll('mc-option')];
    this.#options.filter(o => o.value === this.value).forEach(o => o.selected = true);
    if (!this.#initialOptions) this.#initialOptions = this.#options.map(o => o.outerHTML).join('');
  }
}
customElements.define(MCSelectElement.tag, MCSelectElement);
