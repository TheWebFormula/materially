const wfcUtil = new class WFCUtil {
  getNextFocusableElement(element, previous = false, acceptFilter = () => { return true; }) {
    let walker = document.createNodeIterator(
      element.parentElement,
      NodeFilter.SHOW_ELEMENT,
      node => {
        return node.tabIndex >= 0 && acceptFilter(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      }
    );
    
    // do not find entry node if not focusable
    if (element.tabIndex >= 0) {
      let node = walker.nextNode();
      while (node !== element) {
        node = walker.nextNode();
      }
    }

    if (previous) {
      walker.previousNode()
      return walker.previousNode();
    }
    return walker.nextNode();
  }

  getNextFocusableElement2(containerElement, previous = false, acceptFilter = () => { return true; }) {
    let walker = document.createNodeIterator(
      containerElement,
      NodeFilter.SHOW_ELEMENT,
      node => {
        return node.tabIndex >= 0 && acceptFilter(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      }
    );

    const activeElement = document.activeElement;
    const containsFocus = containerElement.contains(activeElement);
    if (!containsFocus) return walker.nextNode();

    // get current focused
    let node = walker.nextNode();
    while (node !== activeElement) {
      node = walker.nextNode();
    }

    if (previous) {
      walker.previousNode()
      return walker.previousNode();
    }

    return walker.nextNode();
  }

  getFocusableElements(parent, excludeCB = () => { }) {
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT);
    let node;
    let elements = [];
    while (node = walker.nextNode()) {
      if (!excludeCB(node) && this.#isElementFocusable(node)) elements.push(node);
    }
    return elements;
  }

  #isElementFocusable(element) {
    if (!element) return false;
    return !element.hasAttribute('disabled') && (
      element.nodeName === 'WFC-TEXTFIELD'
      || element.role === 'menuitem'
      || element.role === 'option'
      || element.tabindex > -1
    );
  }

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
}

window.wfcUtil = wfcUtil;
export default wfcUtil;
