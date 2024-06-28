import fuzzySearch from './fuzzySearch.js';


const mcUtil = new class MCUtil {
  #textWidthCanvas;
  #scrollHandler_bound = this.#scrollHandler.bind(this);


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

  // can use array of strings ['one', 'two']
  // can also use array of objects with label property [{ label: 'one' }, { label: 'two' }] || [{ value: 'one' }, { value: 'two' }]
  fuzzySearch(searchTerm, items = [], distanceCap = 0.2) {
    return fuzzySearch(searchTerm, items, distanceCap);
  }

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

    const activeElement = document.activeElement;
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

  // getFocusableElements(parent, excludeCB = () => { }) {
  //   const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT);
  //   let node;
  //   let elements = [];
  //   while (node = walker.nextNode()) {
  //     if (!excludeCB(node) && this.#isElementFocusable(node)) elements.push(node);
  //   }
  //   return elements;
  // }

  // #isElementFocusable(element) {
  //   if (!element) return false;
  //   return !element.hasAttribute('disabled') && (
  //     element.nodeName === 'MC-TEXTFIELD'
  //     || element.role === 'menuitem'
  //     || element.role === 'option'
  //     || element.tabindex > -1
  //   );
  // }

  // <div>one<div></div></div> === one
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

  async nextAnimationFrameAsync() {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    });
  }

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
  trackPageScroll(callback = () => { }) {
    if (this.#scrollCallbacks.length === 0) {
      if (!this.#initialScroll) this.#lastScrollTop = document.documentElement.scrollTop;
      else this.#initialScroll = false;
      window.addEventListener('scroll', this.#scrollHandler_bound);
    }
    this.#scrollCallbacks.push(callback);
  }

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
