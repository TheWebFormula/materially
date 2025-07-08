import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';
import { close_FILL0_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';



export default class MCDialogElement extends HTMLComponentElement {
  static tag = 'mc-dialog';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #dialog;
  #form;
  #lock = false;

  #preventClose = false;
  #preventNavigation = false;
  #removeOnClose = false;
  #closeIgnoreElements = [];

  #handleCancel_bound = this.#handleCancel.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #handleEsc_bound = this.#handleEsc.bind(this);
  #clickOutsideClose_bound = this.#clickOutsideClose.bind(this);
  #handleSubmit_bound = this.#handleSubmit.bind(this);
  #handleActionsClick_bound = this.#handleActionsClick.bind(this);
  #beforeUnload_bound = this.#beforeUnload.bind(this);
  #fullscreenClose_bound = this.#fullscreenClose.bind(this);
  #fullscreenSave_bound = this.#fullscreenSave.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    this.render();
    this.#dialog = this.shadowRoot.querySelector('dialog');
    if (this.querySelector('[slot="icon"]')) this.shadowRoot.querySelector('.header').classList.add('has-icon');
    if (this.querySelector('[slot="actions"]')) this.shadowRoot.querySelector('[name=actions]').classList.add('has-actions');
  }

  template() {
    return /*html*/`
      <dialog>
        <!-- <div class="background"></div> -->
        <div class="header">
          <slot name="icon"></slot>
          <mc-icon class="close-fullscreen">${close_FILL0_wght400_GRAD0_opsz24}</mc-icon>
          <slot name="headline"></slot>
          <mc-button class="save-fullscreen-form">Save</mc-button>
        </div>
        <slot name="content"></slot>
        <slot name="actions"></slot>
      </dialog>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['prevent-close', 'boolean'],
      ['prevent-navigation', 'boolean'],
      ['fullscreen', 'boolean'],
      ['remove-on-close', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }



  get open() { return this.hasAttribute('open'); }

  get closeIgnoreElements() { return this.#closeIgnoreElements; }
  set closeIgnoreElements(value) {
    this.#closeIgnoreElements = Array.isArray(value) ? value : [];
  }

  get fullscreen() { return this.hasAttribute('fullscreen'); }
  set fullscreen(value) {
    this.toggleAttribute('fullscreen', !!value);
    const form = !value ? undefined : this.querySelector('form');
    this.shadowRoot.querySelector('.save-fullscreen-form').classList.toggle('show', !!form);
  }

  get preventClose() { return this.#preventClose; }
  set preventClose(value) {
    this.#preventClose = !!value;
  }

  get preventNavigation() { return this.#preventNavigation; }
  set preventNavigation(value) {
    this.#preventNavigation = !!value;
  }

  get removeOnClose() { return this.#removeOnClose; }
  set removeOnClose(value) { this.#removeOnClose = !!value; }

  get lock() { return this.#lock; }
  set lock(value) {
    this.#lock = !!value;
    this.classList.toggle('lock', this.#lock);
  }


  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }
  }

  show(triggerElement) {
    this.showModal(triggerElement);
  }

  showModal(triggerElement) {
    this.setAttribute('open', '');
    this.#dialog.showModal();
    this.#showAfter(triggerElement);
  }

  close(returnValue) {
    if (!this.open) return;
    const previousReturnValue = this.returnValue;
    this.returnValue = returnValue;

    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      this.returnValue = previousReturnValue;
      return; 
    }

    this.#dialog.close(returnValue);
  }



  #showAfter(triggerElement) {
    this.lock = false;

    if (triggerElement) {
      this.#dialog.classList.add('trigger-animation');
      const triggerBounds = triggerElement.getBoundingClientRect();
      
      let totalWidth;
      let totalHeight;
      let offsetX;
      let offsetY;
      if (this.fullscreen) {
        totalWidth = window.innerWidth;
        totalHeight = window.innerHeight;
        offsetX = triggerBounds.left;
        offsetY = triggerBounds.top;
      } else {
        totalWidth = this.#dialog.offsetWidth;
        totalHeight = this.#dialog.offsetHeight;
        const dialogBounds = this.#dialog.getBoundingClientRect();
        offsetX = triggerBounds.right - dialogBounds.right;
        offsetY = triggerBounds.bottom - dialogBounds.bottom;
      }

      const initialWidth = Math.round((triggerBounds.width / totalWidth) * 100);
      const initialHeight = Math.round((triggerBounds.height / totalHeight) * 100);
      this.#dialog.style.setProperty('--mc-trigger-x', `${offsetX}px`);
      this.#dialog.style.setProperty('--mc-trigger-y', `${offsetY}px`);
      this.#dialog.style.setProperty('--mc-trigger-width', `${initialWidth}%`);
      this.#dialog.style.setProperty('--mc-trigger-height', `${initialHeight}%`);
    }

    if (!this.#abort) {
      this.#abort = new AbortController();
    }
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#handleEsc_bound, { signal: this.#abort.signal });

    if (!this.preventClose) window.addEventListener('click', this.#clickOutsideClose_bound, { signal: this.#abort.signal, capture: true });
    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });

    this.#form = this.querySelector('form');
    if (this.#form) {
      this.#form.track();
      this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.addEventListener('click', this.#handleActionsClick_bound, { signal: this.#abort.signal })
      }
    }

    if (this.fullscreen) {
      this.shadowRoot.querySelector('.close-fullscreen').addEventListener('click', this.#fullscreenClose_bound, { signal: this.#abort.signal });
      if (this.#form) {
        this.shadowRoot.querySelector('.save-fullscreen-form').addEventListener('click', this.#fullscreenSave_bound, { signal: this.#abort.signal });
      }
    }


    const isScroll = this.#dialog.scrollHeight > 0 && this.#dialog.offsetHeight !== this.#dialog.scrollHeight;
    this.#dialog.classList.toggle('scroll', isScroll);

    this.dispatchEvent(new Event('open', { bubbles: true }));
  }



  #handleCancel(event) {
    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      event.preventDefault();
      return;
    }

    const preventCancel = !this.dispatchEvent(new Event('cancel', { cancelable: true }));
    if (preventCancel) event.preventDefault();
  }

  #handleEsc(event) {
    if (event.key === 'Escape') {
      if (!this.#preventClose) this.close();
      else event.preventDefault();
    }
  }

  #clickOutsideClose(event) {
    if (this.#lock) return;
    let ignore = event.composedPath().includes(this) || this.#closeIgnoreElements.find(e => e === event.target);
    const shouldClose = !ignore && event.target !== this && !this.contains(event.target);
    if (shouldClose) {
      window.removeEventListener('click', this.#clickOutsideClose_bound);
      this.close();
    }
  }

  #handleActionsClick(event) {
    this.close(event.target.getAttribute('value') ?? this.returnValue);
  }

  // for prevent navigation
  #beforeUnload(event) {
    event.preventDefault();
    event.returnValue = 'You may have unsaved changes';
  }


  async #handleSubmit(event) {
    const form = event.target;
    const { submitter } = event;
    
    if (submitter.nodeName === 'MC-BUTTON' && submitter.async && submitter.isPending) {
      this.lock = true;
      const value = await submitter.pending();
      this.lock = false;
      if (value === false) return;
    }

    if (form.method !== 'dialog' || !submitter) return;
    this.close(submitter.getAttribute('value') ?? this.returnValue);
  }


  async #handleClose() {
    this.removeAttribute('open');
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }

    if (this.removeOnClose) {
      await util.animationendAsync(this.#dialog);
      this.parentElement.removeChild(this);
    }
  }


  async #fullscreenClose(event) {
    if (this.#form) {
      const prevent = this.hasAttribute('formnovalidate') ? false : await this.#form.formState.preventUnsavedChanges(event);
      if (prevent) return;

      // TODO reset automatically?
      // this.#form.reset();
    }
    this.close();
  }

  async #fullscreenSave(event) {
    this.#form.requestSubmit(event.target);
  }
}

customElements.define(MCDialogElement.tag, MCDialogElement);
