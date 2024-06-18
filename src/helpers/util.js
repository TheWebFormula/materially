import fuzzySearch from './fuzzySearch.js';


const mcUtil = new class MCUtil {
  #textWidthCanvas;
  #scrollHandler_bound = this.#scrollHandler.bind(this);


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
    this.#lastScrollDirection = direction;
    this.#lastScrollTop = document.documentElement.scrollTop;

    this.#scrollCallbacks.forEach(callback => callback({
      event,
      isScrolled: document.documentElement.scrollTop > 0,
      scrollTop: document.documentElement.scrollTop,
      direction,
      distance,
      directionChange
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
}

window.mcUtil = mcUtil;
export default mcUtil;
