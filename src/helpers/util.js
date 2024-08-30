import fuzzySearch from './fuzzySearch.js';


let pointerDown = false;
window.addEventListener('pointerdown', () =>  pointerDown = true);
window.addEventListener('pointerup', () => pointerDown = false);

const mcUtil = new class MCUtil {
  #textWidthCanvas;
  #scrollHandler_bound = this.#scrollHandler.bind(this);

  /**
  * Globally tracked mouse down state
  * @return {Boolean}
  */
  get pointerDown() {
    return pointerDown;
  }

  /**
   * Throttling controlled by requestAnimationFrame
   * @function
   * @param {String} fn - Callback function
   */
  rafThrottle(fn) {
    let alreadyQueued;
    return function throttled() {
      const args = arguments;
      const context = this;
      if (!alreadyQueued) {
        alreadyQueued = true;
        fn.apply(context, args);
        requestAnimationFrame(() => {
          alreadyQueued = false;
        });
      }
    };
  }

  /**
   * Toggle color scheme between dark and light
   * @function
   * @param {String} scheme - 'dark' or 'light'
   */
  toggleColorScheme(scheme) {
    const isDark = ['dark', 'light'].includes(scheme) ? scheme === 'dark' : !document.documentElement.classList.contains('mc-theme-dark');
    document.documentElement.classList.toggle('mc-theme-dark', isDark);
    return isDark ? 'dark' : 'light';
  }

  /**
   * Fuzzy search using Jaro winkler distance
   * can use array of strings ['one', 'two']
   * can also use array of objects with label property [{ label: 'one' }, { label: 'two' }] || [{ value: 'one' }, { value: 'two' }]
   * @function
   * @param {String} searchTerm - String used for searching
   * @param {Array.<{value:String, label:String}> | Array.<String>} items - String used for searching
   * @param {Number} distanceCap - 0 - 1
   * @return {Array.<{value:String, label:String}> | Array.<String>} - filtered array
   */
  fuzzySearch(searchTerm, items = [], distanceCap = 0.2) {
    return fuzzySearch(searchTerm, items, distanceCap);
  }


  /**
  * @callback acceptFilter
  * @param  {HTMLElement} node - current node to run logic on
  * @return {boolean}
  */
  /**
   * Get next / previous focusable element based on parent element
   * @function
   * @param {HTMLElement} containerElement - Parent element containing focus children
   * @param {Boolean} previous - switch to previous element
   * @param {acceptFilter} acceptFilter - function with custom filtering logic
   * @return {Array.<{value:String, label:String}> | Array.<String>} - filtered array
   */
  getNextFocusableElement(containerElement, previous = false, acceptFilter = () => { return true; }) {
    let walker = document.createNodeIterator(
      containerElement,
      NodeFilter.SHOW_ELEMENT,
      node => {
        return node.tabIndex !== -1 && acceptFilter(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      }
    );

    let activeElement = document.activeElement;
    if (activeElement.shadowRoot) activeElement = activeElement.shadowRoot.activeElement;
    const containsFocus = containerElement.contains(activeElement);
    if (!containsFocus) return walker.nextNode();

    // get current focused
    let node = walker.nextNode();
    while (node && node !== activeElement) {
      node = walker.nextNode();
    }

    if (previous) {
      walker.previousNode()
      return walker.previousNode();
    }

    return walker.nextNode();
  }

  /**
   * Get text from node recursively
   * Example: <div>one<div></div></div> === one
   * @function
   * @param {HTMLElement} element - element to get text from
   * @return {String}
   */
  getTextFromNode(element) {
    let nextNode;
    let hasHitTextNode = false;
    const textNodes = [...element.childNodes].filter(node => {
      const isTextNode = node.nodeType === 3;
      if (hasHitTextNode && !nextNode) nextNode = node;
      else if (isTextNode && !!node.textContent.trim()) hasHitTextNode = true;
      return isTextNode;
    });

    return textNodes
      .map(node => node.data.replace(/\n/g, '').replace(/\s+/g, ' ').trim())
      .join('')
      .trim();
  }

  /**
   * Async function for animationend event
   * @function
   * @param {HTMLElement} element
   * @return {Promise}
   */
  async animationendAsync(element) {
    return new Promise(resolve => {
      function onAnimationend(e) {
        element.removeEventListener('animationend', onAnimationend);
        element.removeEventListener('animationcancel', onAnimationend);
        resolve();
      }

      element.addEventListener('animationend', onAnimationend);
      element.addEventListener('animationcancel', onAnimationend);
    });
  }

  /**
   * Async function for transitionend event
   * @function
   * @param {HTMLElement} element
   * @return {Promise}
   */
  async transitionendAsync(element) {
    return new Promise(resolve => {
      function onTransitionend() {
        element.removeEventListener('transitionend', onTransitionend);
        element.removeEventListener('transitioncancel', onTransitionend);
        resolve();
      }

      element.addEventListener('transitionend', onTransitionend);
      element.addEventListener('transitioncancel', onTransitionend);
    });
  }

  /**
   * Async function for nextAnimationFrameAsync
   * @function
   * @param {HTMLElement} element
   * @return {Promise}
   */
  async nextAnimationFrameAsync() {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    });
  }

  /**
   * Debounce function
   * @function
   * @param {Function} fn - Callback function
   * @param {Int} wait - Milliseconds. Default is 10ms
   */
  debounce(fn, wait) {
    let timer;
    return function debounced() {
      const args = arguments;
      const context = this
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        fn.apply(context, args);
      }, wait || 10);
    };
  }


  #scrollCallbacks = [];
  #initialScroll = false;
  #lastScrollTop;
  #lastScrollDirection;
  #distanceFromDirectionChange = 0;

  /**
   * Global page scroll tracking
   * @function
   * @param {Function} callback - Callback function
   */
  trackPageScroll(callback = () => { }) {
    if (this.#scrollCallbacks.length === 0) {
      if (!this.#initialScroll) this.#lastScrollTop = document.documentElement.scrollTop;
      else this.#initialScroll = false;
      window.addEventListener('scroll', this.#scrollHandler_bound);
    }
    this.#scrollCallbacks.push(callback);
  }

  /**
   * Untrack Global page scroll tracking
   * @function
   * @param {Function} callback - Callback function
   */
  untrackPageScroll(callback = () => { }) {
    this.#scrollCallbacks = this.#scrollCallbacks.filter(c => c !== callback);
    if (this.#scrollCallbacks.length === 0) window.removeEventListener('scroll', this.#scrollHandler_bound);
  }


  #scrollHandler(event) {
    const distance = document.documentElement.scrollTop - this.#lastScrollTop;
    if (distance === 0) return;

    const direction = document.documentElement.scrollTop >= this.#lastScrollTop ? -1 : 1;
    const directionChange = direction !== this.#lastScrollDirection;
    if (directionChange) this.#distanceFromDirectionChange = 0;
    this.#distanceFromDirectionChange += distance;
    this.#lastScrollDirection = direction;
    this.#lastScrollTop = document.documentElement.scrollTop;

    this.#scrollCallbacks.forEach(callback => callback({
      event,
      isScrolled: document.documentElement.scrollTop > 0,
      scrollTop: document.documentElement.scrollTop,
      direction,
      distance,
      directionChange,
      distanceFromDirectionChange: this.#distanceFromDirectionChange
    }));
  }


  /**
   * Get input text width
   * @function
   * @param {HTMLInputElement} inputElement
   * @return {Int}
   */
  getTextWidthFromInput(inputElement) {
    if (!inputElement || inputElement.nodeName !== 'INPUT') throw Error('requires input element');
    if (!this.#textWidthCanvas) this.#textWidthCanvas = document.createElement('canvas');
    const styles = window.getComputedStyle(inputElement);
    const context = this.#textWidthCanvas.getContext('2d');
    context.font = `${styles.getPropertyValue('font-weight')} ${styles.getPropertyValue('font-size')} ${styles.getPropertyValue('font-family')}`;
    context.letterSpacing = styles.getPropertyValue('letter-spacing');
    const metrics = context.measureText(inputElement.value);
    return Math.ceil(metrics.width);
  }



  #longPressListeners = [];
  /**
   * @typedef {Object} addLongPressListenerConfig
   * @property  {Int} ms - How long to wait till considered pressed
   * @property  {Boolean} disableMouseEvents
   * @property  {Boolean} disableTouchEvents
   * @property  {Boolean} once - Auto remove after first event
   */
  /**
   * Get input text width
   * @function
   * @param {HTMLInputElement} element
   * @param {String} listener
   * @param {addLongPressListenerConfig} config
   */
  addLongPressListener(element, listener, config = {
    ms: 450,
    disableMouseEvents: false,
    disableTouchEvents: false,
    once: false
  }) {
    let timeout;
    let textSelectionTimeout;
    let target;
    let startX;
    let startY;
    let lastEvent;
    let once = config.once === undefined ? false : config.once;

    function start(event) {
      // right click
      if (event.ctrlKey || event.which === 3) return;

      target = event.target;
      startX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      startY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
      timeout = setTimeout(() => {
        listener(lastEvent);
        remove();
      }, config.ms || 450);

      element.addEventListener('pointerup', remove);
      element.addEventListener('pointermove', move);
      window.addEventListener('contextmenu', preventContextMenu);

      // prevent text selection on mobile
      // adding a timeout seems to allow desktop text selection
      textSelectionTimeout = setTimeout(() => {
        element.classList.add('prevent-user-selection');
      }, 0);
    }

    function remove(_event, destroy = false) {
      if (timeout) clearTimeout(timeout);
      if (textSelectionTimeout) clearTimeout(textSelectionTimeout);
      lastEvent = undefined;
      if (once || destroy) {
        element.removeEventListener('pointerdown', start);
      }
      element.removeEventListener('pointerup', remove);
      element.removeEventListener('pointermove', move);
      window.removeEventListener('contextmenu', preventContextMenu);
      element.classList.remove('prevent-user-selection');
    }

    function move(event) {
      lastEvent = event;
      const x = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      const y = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
      const distanceX = x - startX;
      const distanceY = y - startY;
      const distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
      if (distance > 3) remove();
    }

    function preventContextMenu(event) {
      event.preventDefault();
      return false;
    }

    element.addEventListener('pointerdown', start);

    this.#longPressListeners.push({
      element,
      remove
    });
  }

  /**
   * Remove long press event listener
   * @function
   * @param {HTMLInputElement} element
   */
  removeLongPressListener(element) {
    this.#longPressListeners = this.#longPressListeners.filter(v => {
      if (v.element === element) {
        v.remove(null, true);
        return false;
      }
      return true;
    });
  }


  #clickTimeoutListeners = [];
  /**
   * @typedef {Object} addClickTimeoutEventOptions
   * @property  {Signal} signal - AbortController signal
   */
  /**
   * Click event that auto remove after period of time
   * @function
   * @param {HTMLInputElement} element
   * @param {String} listener
   * @param {addClickTimeoutEventOptions} options
   */
  addClickTimeoutEvent(element, listener, options) {
    let timer;

    function pointerdown() {
      timer = setTimeout(end, 320);
      element.addEventListener('pointerup', pointerup);
    }

    function pointerup(event) {
      end();
      listener(event);
    }

    function end() {
      element.removeEventListener('pointerup', pointerup);
      clearTimeout(timer);
    }

    function remove() {
      clearTimeout(timer);
      element.removeEventListener('pointerdown', pointerdown);
      element.removeEventListener('pointerup', pointerup);
    }

    element.addEventListener('pointerdown', pointerdown);

    if (options?.signal) options.signal.addEventListener('abort', remove);

    this.#clickTimeoutListeners.push({
      element,
      listener,
      remove
    });
  }

  /**
   * Remove click timeout event listener
   * @function
   * @param {HTMLInputElement} element
   * @param {String} listener
   */
  removeClickTimeoutEvent(element, listener) {
    this.#clickTimeoutListeners = this.#clickTimeoutListeners.filter(v => {
      if (v.element === element && v.listener === listener) {
        v.remove();
        return false;
      }
      return true;
    });
  }
}

window.mcUtil = mcUtil;
export default mcUtil;
