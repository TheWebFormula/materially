import device from './device.js';


export default class Drag {
  #abortMain;
  #element;
  #listOrderElement;
  #enabled = false;
  #useSwap = false;
  #dragItems = [];
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);
  #over_bound = this.#over.bind(this);
  #drop_bound = this.#drop.bind(this);


  constructor(element, swap = false) {
    if (!(element instanceof HTMLElement)) throw Error('HTMLElement required');

    this.#useSwap = swap;
    this.#element = element;
  }

  get listOrderElement() { return this.#listOrderElement; }
  set listOrderElement(value) {
    if (value && !(value instanceof HTMLElement)) throw Error('Element required');
    this.#listOrderElement = value;
  }

  get swap() {
    return this.#useSwap;
  }
  set swap(value) {
    this.#useSwap = !!value;
  }

  enable() {
    if (this.#enabled) return;
    this.#enabled = true;

    this.#abortMain = new AbortController();
    this.#element.addEventListener('dragstart', this.#start_bound, { signal: this.#abortMain.signal });
  }

  destroy() {
    this.#abortMain.abort();
    this.#listOrderElement = undefined;
    this.#element = undefined;
  }

  #start(event) {
    this.#element.addEventListener('dragend', this.#end_bound, { signal: this.#abortMain.signal });

    if (this.#listOrderElement) {
      this.#element.classList.add('drag-active');
      this.#element.style.opacity = '0.6';
      this.#dragItems = [...this.#listOrderElement.querySelectorAll('[draggable=true]')];
      this.#dragItems.forEach((e, i) => {
        const order = `${(i * 2) + 2}`;
        e.style.order = order;
        e.originalOrder = order;
        e.shadowRoot.querySelector('.container').style.pointerEvents = 'none';
      });
      // this.#startIndex = draggableItems.indexOf(this.#element);

      // draggableItems.forEach(e => e.shadowRoot.querySelector('.container').style.pointerEvents = 'none');
      this.#listOrderElement.addEventListener('dragover', this.#over_bound, { signal: this.#abortMain.signal });
      this.#listOrderElement.addEventListener('drop', this.#drop_bound, { signal: this.#abortMain.signal });
    }

    // TODO fix this hack. This is done because IOs safari shows black background at corners
    if (device.state === device.COMPACT) {
      event.target.style.borderRadius = '0';
      requestAnimationFrame(() => {
        event.target.style.borderRadius = '';
      });
    }


    event.dataTransfer.setData('text/plain', 'drag'); // needed for safari to work
    event.stopPropagation(); // let child take the drag
    event.dataTransfer.dropEffect = 'move';
  }

  #end(event) {
    event.dataTransfer.dropEffect = 'move';
    this.#element.removeEventListener('dragend', this.#end_bound);

    if (this.#listOrderElement) {
      this.#element.style.opacity = '';
      this.#element.classList.remove('drag-active');
      this.#dragItems.forEach(e => e.shadowRoot.querySelector('.container').style.pointerEvents = '');
      this.#listOrderElement.removeEventListener('dragover', this.#over_bound);
      this.#listOrderElement.removeEventListener('drop', this.#drop_bound);
      const changed = parseInt(this.#element.style.order) !== parseInt(this.#element.originalOrder);
      if (changed) {
        this.#dragItems.sort((a, b) => parseInt(a.style.order) - parseInt(b.style.order));
        const container = this.#listOrderElement;
        const el = this.#element;
        this.#dragItems.forEach((e, i) => container.insertAdjacentElement('beforeend', e));
        this.#dragItems = [];
        el.dispatchEvent(new Event('reorder', { bubbles: true }));
      }
    }
  }

  #drop(event) {
    event.preventDefault();
  }

  #over(event) {
    event.preventDefault();

    if (this.#listOrderElement === event.target) return;
    if (event.target === this.#element) return;

    if (this.#useSwap) this.#swap(event.target);
    else this.#reorder(event.target);
  }

  // shift all elements
  #reorder(dropTarget) {
    const dropOrder = parseInt(dropTarget.style.order);
    const elementOrder = parseInt(this.#element.style.order);
    const order = dropOrder < elementOrder ? dropOrder - 1 : dropOrder + 1;
    if (elementOrder === order) this.#element.style.order = this.#element.originalOrder;
    else this.#element.style.order = order;
  }


  // swap positions of elements
  #swap(dropTarget) {
    const targetPreOrder = parseInt(dropTarget.style.order);
    const elementOriginalOrder = parseInt(this.#element.originalOrder);
    this.#dragItems.forEach(e => e.style.order = e.originalOrder);
    if (targetPreOrder === elementOriginalOrder) return;

    const dropOrder = parseInt(dropTarget.style.order);
    const elementOrder = parseInt(this.#element.style.order);
    this.#element.style.order = dropOrder;
    dropTarget.style.order = elementOrder;
  }
}
