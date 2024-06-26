export default class Drag {
  #abortMain;
  #element;
  #listOrderElement;
  #startIndex;
  #enabled = false;
  #none;
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);
  #over_bound = this.#over.bind(this);
  #drop_bound = this.#drop.bind(this);


  constructor(element) {
    if (!(element instanceof HTMLElement)) throw Error('HTMLElement required');

    this.#element = element;
  }

  get listOrderElement() { return this.#listOrderElement; }
  set listOrderElement(value) {
    if (value && !(value instanceof HTMLElement)) throw Error('Element required');
    this.#listOrderElement = value;
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
      let draggableItems = [...this.#listOrderElement.querySelectorAll('[draggable=true]')];
      this.#startIndex = draggableItems.indexOf(this.#element);

      draggableItems.forEach(e => e.shadowRoot.querySelector('.container').style.pointerEvents = 'none');
      this.#listOrderElement.addEventListener('dragover', this.#over_bound, { signal: this.#abortMain.signal });
      this.#listOrderElement.addEventListener('drop', this.#drop_bound, { signal: this.#abortMain.signal });
    }

    // TODO fix this hack. This is done because IOs safari shows black background at corners
    event.target.style.borderRadius = '0';
    requestAnimationFrame(() => {
      event.target.style.borderRadius = '';
    });


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
      let draggableItems = [...this.#listOrderElement.querySelectorAll('[draggable=true]')];
      draggableItems.forEach(e => e.shadowRoot.querySelector('.container').style.pointerEvents = '');
      this.#listOrderElement.removeEventListener('dragover', this.#over_bound);
      this.#listOrderElement.removeEventListener('drop', this.#drop_bound);
      
      let newIndex = draggableItems.indexOf(this.#element);
      if (this.#startIndex !== newIndex) this.#element.dispatchEvent(new Event('reorder', { bubbles: true }));
    }
  }

  #drop (event) {
    event.preventDefault();
  }

  #over(event) {
    if (event.target !== this.#element && this.#listOrderElement !== event.target) event.target.insertAdjacentElement('beforebegin', this.#element);
    event.preventDefault();
  }
}
