import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './search.css' assert { type: 'css' };
import fuzzySearch from '../../helpers/fuzzySearch.js'
import '../textfield/index.js';
import '../menu/index.js';
import {
  search_FILL0_wght400_GRAD0_opsz24,
  close_FILL0_wght400_GRAD0_opsz24,
  history_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24,
  mic_FILL1_wght400_GRAD0_opsz24
} from '../../helpers/svgs.js';
import device from '../../helpers/device.js';
import util from '../../helpers/util.js';

const isIncrementalSupported = 'incremental' in document.createElement('input');
const speechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;


// TODO filter chip scroll

class MCSearchElement extends HTMLComponentElement {
  static tag = 'mc-search';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];


  #abort;
  #showAbort;
  #input;
  #selected;
  #selectedObject;
  #menu;
  #inputContainer;
  #results = [];
  #suggestions = [];
  #incremental;
  #speech;
  #speechRecognition;
  #speechListening;
  #history = null;
  #historyMax = 100;
  #historyItems = [];
  #searchTimeout;
  #searchTimeoutSeconds = 3;
  #open_bound = this.#open.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #onSearch_bound = this.#onSearch.bind(this);
  #clear_bound = this.#clear.bind(this);
  #back_bound = this.#back.bind(this);
  #optionClick_bound = this.#optionClick.bind(this);
  #onKeyDown_bound = this.#onKeyDown.bind(this);
  #micClick_bound = this.#micClick.bind(this);
  #renderSuggestions_debounced = util.debounce(this.#renderSuggestions, 50).bind(this);
  #incrementalPolyfill_debounced = util.debounce(this.#onSearch, 300).bind(this);


  constructor() {
    super();

    this.role = 'search';
    this.render();
    this.#input = this.shadowRoot.querySelector('input');
    this.#inputContainer = this.shadowRoot.querySelector('.input');
    this.#menu = this.shadowRoot.querySelector('mc-menu');
    this.#menu.anchor = this.#input;
    this.#menu.disableLetterFocus = true;
    this.#menu.closeIgnoreElements = [this];
    let compact = device.state === device.COMPACT;
    this.classList.toggle('window-compact', compact);
    this.#menu.fullscreen = compact;
    if (compact) this.#menu.allowClose = false;
    
    this.#menu.offsetX = -this.#input.offsetLeft;
  }

  template() {
    return /*html*/`
      <div class="search">
        <div class="input">
          <slot name="leading"></slot>
          <mc-icon class="search-icon">${search_FILL0_wght400_GRAD0_opsz24}</mc-icon>
          <mc-icon class="back" aria-label="back">${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</mc-icon>
          <input type="search" />
          <mc-icon-button class="mic" aria-label="speech">
            <mc-icon>${mic_FILL1_wght400_GRAD0_opsz24}</mc-icon>
          </mc-icon-button>
          <mc-icon-button class="clear" aria-label="clear">
            <mc-icon>${close_FILL0_wght400_GRAD0_opsz24}</mc-icon>
          </mc-icon-button>
          <slot name="trailing"></slot>
          <mc-divider></mc-divider>
        </div>

        <mc-menu always-below>
          <mc-progress-linear indeterminate disabled></mc-progress-linear>
          <mc-chip-set scroll class="hide">
            <slot name="chips"></slot>
          </mc-chip-set>
          <div class="no-results">No items</div>
          <slot name="suggestions"></slot>
          <slot class="options-container"></slot>
        </mc-menu>
        
      </div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['placeholder', 'string'],
      ['incremental', 'boolean'],
      ['history', 'default'],
      ['history-max', 'int'],
      ['speech', 'boolean'],
      ['search-timeout-seconds', 'int']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get value() { return this.#input.value; }
  set value(value) {
    this.#input.value = value;
  }

  get selected() { return this.#selected; }
  get selectedObject() { return this.#selectedObject; }

  get placeholder() { return this.#input.placeholder }
  set placeholder(value) {
    this.#input.placeholder = value;
  }

  get incremental() { return this.#incremental; }
  set incremental(value) {
    this.#incremental = value;
    this.#input.incremental = this.#incremental;
  }

  get searchTimeoutSeconds() { return this.#searchTimeoutSeconds; }
  set searchTimeoutSeconds(value = 3) {
    this.#searchTimeoutSeconds = value;
  }

  get history() { return this.#history; }
  set history(value) {
    this.#history = typeof value === 'string' ? (value || this.getAttribute('id') || '_global') : null;
    if (this.#history) this.#historyItems = JSON.parse(localStorage.getItem(`mc_search_history_${this.#history}`) || '[]');
  }

  get historyMax() { return this.#historyMax; }
  set historyMax(value) {
    this.#historyMax = value;
  }

  get speech() { return this.#speech; }
  set speech(value) {
    this.#speech = value;
    if (this.#speech) this.#enableSpeechRecognition();
    else this.#disableSpeechRecognition();
    this.shadowRoot.querySelector('.mic').classList.toggle('show', this.#speech);
  }

  get results() { return this.#results; }
  set results(value = []) {
    if (value && (!Array.isArray(value) || value.find(v => v.value === undefined))) {
      throw Error('results must be an Array of Objects with at least a value property: [{ value: ""}]');
    }

    this.#results = value || [];
    this.resolve();
    this.#renderResults();
  }

  get suggestions() { return this.#suggestions; }
  set suggestions(value = []) {
    if (value && (!Array.isArray(value) || value.find(v => v.value === undefined))) {
      throw Error('suggestions must be an Array of Objects with at least a value property: [{ value: ""}]');
    }

    this.#suggestions = value || [];
    if (this.#history && Array.isArray(this.#suggestions) && this.#suggestions.length > 0) this.#storHistory(this.#suggestions);
    this.#renderSuggestions();
  }

  get filters() {
    return [...this.querySelectorAll('mc-chip')].filter(c => c.checked).map(c => c.value);
  }

  connectedCallback() {
    super.connectedCallback();

    this.#abort = new AbortController();
    this.#menu.addEventListener('open', this.#open_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
    if (this.#showAbort) this.#showAbort.abort();
    this.#disableSpeechRecognition();
  }



  pending() {
    this.classList.add('loading');
    this.shadowRoot.querySelector('mc-progress-linear').removeAttribute('disabled');
    this.#searchTimeout = setTimeout(() => {
      this.resolve();
    }, this.#searchTimeoutSeconds * 1000);
  }

  async resolve() {
    if (this.#searchTimeout) clearTimeout(this.#searchTimeout);
    this.classList.remove('loading');
    const progress = this.shadowRoot.querySelector('mc-progress-linear');
    await util.transitionendAsync(progress);
    progress.setAttribute('disabled', '');
  }

  clearHistory() {
    if (this.#history) {
      localStorage.removeItem(`mc_search_history_${this.#history}`);
      this.#historyItems = [];
    }
  }


  #open() {
    this.#menu.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    this.#menu.style.minWidth = `${this.offsetWidth}px`;
    this.ariaExpanded = true;
    if (this.#menu.fullscreen) this.#preShowFullscreen();
    this.classList.add('open');

    this.#showAbort = new AbortController();
    this.#input.selectionStart = 10000;
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#showAbort.signal });
    this.#input.addEventListener('search', this.#onSearch_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('mc-menu').addEventListener('click', this.#optionClick_bound, { signal: this.#showAbort.signal });
    this.shadowRoot.querySelector('.clear').addEventListener('click', this.#clear_bound, { signal: this.#showAbort.signal });
    window.addEventListener('keydown', this.#onKeyDown_bound, { signal: this.#showAbort.signal });
    if (this.#menu.fullscreen) this.shadowRoot.querySelector('.back').addEventListener('click', this.#back_bound, { capture: true, signal: this.#showAbort.signal });
    this.#input.focus();
  }

  #handleClose() {
    this.#menu.removeEventListener('close', this.#handleClose_bound);
    if (this.#showAbort) {
      this.#showAbort.abort();
      this.#showAbort = undefined;
    }
    this.ariaExpanded = false;
    this.classList.remove('open');
  }

  #renderResults(clear = false) {
    const containers = Object.fromEntries([...this.querySelectorAll('mc-search-option-group[id]')].map(element => ([element.id, { element, template: '' }])));
    containers._default = { default: true, element: this, template: '' };
    this.results.reduce((obj, result) => {
      const container = obj[result.container] ? result.container : '_default';
      if (clear) obj[container].template = '';
      else obj[container].template += `<mc-search-option value="${result.value}">
        ${result.icon ? `<mc-icon slot="start">${result.icon}</mc-icon>` : ''}
        ${result.display || result.value}
      </mc-search-option>`;
      return obj;
    }, containers);

    [...this.querySelectorAll('mc-search-option:not([slot])')].forEach(e => e.remove());
    Object.values(containers).forEach(item => {
      if (!item.default) item.element.innerHTML = item.template;
    });

    // insert any non containerd items before containerd items
    const searchContainer = this.querySelector('mc-search-option-group');
    if (searchContainer) searchContainer.insertAdjacentHTML('beforebegin', containers._default.template);
    else this.insertAdjacentHTML('beforeend', containers._default.template)

    this.#menu.setPosition();
  }

  #renderSuggestions(clear = false) {
    [...this.querySelectorAll('mc-search-option[slot="suggestions"]')].forEach(e => e.remove());
    if (clear) return;

    const inputValue = this.value;
    this.insertAdjacentHTML('afterbegin', this.suggestions.filter(v => v.value !== inputValue).map(item => `
      <mc-search-option slot="suggestions" value="${item.value}">
        <mc-icon slot="start">${search_FILL0_wght400_GRAD0_opsz24}</mc-icon>
        ${item.display || item.value}
      </mc-search-option>
    `).join(''));


    if (this.value) {
      const historyMinusSuggestions = this.#historyItems.filter(h => !this.#suggestions.find(s => s.value === h.value) && h.value !== inputValue);
      const filtered = fuzzySearch(this.value, historyMinusSuggestions, 0.3);
      this.insertAdjacentHTML('afterbegin', filtered.map(item => `
        <mc-search-option slot="suggestions" value="${item.value}">
          <mc-icon slot="start">${history_FILL0_wght400_GRAD0_opsz24}</mc-icon>
          ${item.display || item.value}
        </mc-search-option>
      `).join(''));
    }

    this.#menu.setPosition();
  }

  #storHistory(suggestions) {
    suggestions.forEach(item => {
      if (this.#historyItems.find(h => h.value === item.value)) return;
      this.#historyItems.unshift(item);
    });

    if (this.#historyItems.length > this.#historyMax) this.#historyItems = this.#historyItems.slice(0, this.#historyMax);
    localStorage.setItem(`mc_search_history_${this.#history}`, JSON.stringify(this.#historyItems));
  }

  #slotChange(event) {
    if (event.target.getAttribute('name') === 'chips') {
      event.target.parentElement.classList.remove('hide');
      event.target.addEventListener('change', this.#onSearch_bound, { signal: this.#abort.signal });
    }
  }

  #onSearch() {
    if (this.#input.value) this.pending();

    this.dispatchEvent(new Event('search', {
      bubbles: true,
      composed: true
    }));
  }

  #onInput() {
    const hasValue = !!this.#input.value;
    this.#inputContainer.classList.toggle('has-value', hasValue);
    this.#menu.classList.toggle('has-value', hasValue);

    if (hasValue) {
      this.#renderSuggestions_debounced();
      if (!isIncrementalSupported) this.#incrementalPolyfill_debounced();
    } else {
      this.#renderSuggestions(true);
      this.#renderResults(true);
    }
  }

  #back(event) {
    const target = event.composedPath()[0];
    if (target.classList.contains('back')) {
      this.#menu.close();
    }
  }

  #clear() {
    this.value = '';
    this.#inputContainer.classList.remove('has-value');
    this.#menu.classList.remove('has-value');
    this.#clearResults();
    this.#clearSuggestions();
    this.#input.focus();
    this.dispatchEvent(new Event('clear', {
      bubbles: true,
      composed: true
    }));
  }

  #clearResults() {
    this.results = [];
  }

  #clearSuggestions() {
    this.suggestions = [];
  }

  #optionClick(event) {
    if (event.target.nodeName !== 'MC-SEARCH-OPTION') return;

    if (event.target.getAttribute('slot') === 'suggestions') {
      this.value = event.target.value;
      this.#incrementalPolyfill_debounced();
    } else {
      const value = event.target.value;
      this.value = event.target.displayValue || value;
      this.#selected = value;
      this.#selectedObject = this.#results.find(v => v.value === value);
      this.dispatchEvent(new Event('change'), { bubbles: true });
    }
  }

  #onKeyDown(event) {
    const firstOption = this.querySelector('mc-search-option');

    // move from first option to select input
    if (
      event.key === 'ArrowUp'
      && document.activeElement === firstOption
    ) {
      this.#input.focus();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();

      // move from select input to first option
    } else if (
      firstOption
      && (
        (event.key === 'ArrowDown' && document.activeElement === this)
        || (event.key === 'Tab' && document.activeElement.nodeName !== 'MC-SEARCH-OPTION')
      )
    ) {
      firstOption.focus();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();


    } else if (event.key === 'Enter' && document.activeElement.nodeName === 'MC-SEARCH-OPTION') {
      document.activeElement.click();
    }
  }

  #enableSpeechRecognition() {
    if (!speechRecognitionSupported) return console.warn('SpeechRecognition not supported')
    this.#speechRecognition = webkitSpeechRecognition ? new webkitSpeechRecognition() : new SpeechRecognition();
    this.#speechRecognition.lang = device.locale;
    this.#speechRecognition.interimResults = true;
    this.#speechRecognition.continuous = false;
    this.#speechRecognition.maxAlternatives = 1;

    this.shadowRoot.querySelector('.mic').addEventListener('click', this.#micClick_bound);

    this.#speechRecognition.onresult = (event) => {
      this.#speechListening = true;
      const text = event.results[0][0].transcript;
      if (text) {
        this.#input.value = text;
        let hasValue = !!text;
        this.#inputContainer.classList.toggle('has-value', hasValue);
        this.#menu.classList.toggle('has-value', hasValue);
        this.#incrementalPolyfill_debounced();
      }
    };

    this.#speechRecognition.onspeechend = () => {
      this.#speechRecognition.stop();
    };

    this.#speechRecognition.onend = () => {
      this.#speechListening = false;
    };
  }

  #disableSpeechRecognition() {
    if (this.#speechRecognition) {
      this.shadowRoot.querySelector('.mic').removeEventListener('click', this.#micClick_bound);
      this.#speechListening = false;
      this.#speechRecognition.abort();
      this.#speechRecognition = undefined;
    }
  }

  #micClick() {
    if (this.#speechRecognition) {
      if (this.#speechListening) this.#speechRecognition.stop();
      else this.#speechRecognition.start();
    }
  }


  #preShowFullscreen() {
    const bounds = this.getBoundingClientRect()
    const input = this.shadowRoot.querySelector('.input');

    input.style.top = `${bounds.top}px`;
    input.style.left = `${bounds.left}px`;
    input.style.width = `${bounds.width}px`;

    requestAnimationFrame(() => {
      input.classList.add('animate');
      input.style.top = '';
      input.style.left = '';
      input.style.width = '';

      setTimeout(() => {
        input.classList.remove('animate');
      }, 300);
    });
  }
}
customElements.define(MCSearchElement.tag, MCSearchElement);
