import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';
import { close_FILL0_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';
import FormState from '../../helpers/form.js';


export default class MCDialogElement extends HTMLComponentElement {
  static tag = 'mc-dialog';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #dialog;
  #preventClose = false;
  #preventNavigation = false;
  #removeOnClose = false;
  #closeIgnoreElements = [];
  #handleSubmit_bound = this.#handleSubmit.bind(this);
  #beforeUnload_bound = this.#beforeUnload.bind(this);
  #handleActionsClick_bound = this.#handleActionsClick.bind(this);
  #fullscreenClose_bound = this.#fullscreenClose.bind(this);
  #fullscreenSave_bound = this.#fullscreenSave.bind(this);

  #handleCancel_bound = this.#handleCancel.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #handleEsc_bound = this.#handleEsc.bind(this);
  #clickOutsideClose_bound = this.#clickOutsideClose.bind(this);
  #formState;


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

  get preventClose() { return this.#preventClose; }
  set preventClose(value) {
    this.#preventClose = !!value;
  }

  get preventNavigation() { return this.#preventNavigation; }
  set preventNavigation(value) {
    this.#preventNavigation = !!value;
  }

  get fullscreen() { return this.hasAttribute('fullscreen'); }
  set fullscreen(value) {
    this.toggleAttribute('fullscreen', !!value);
    const form = !value ? undefined : this.querySelector('form');
    if (form) this.#formState = new FormState(form);
  }

  get removeOnClose() { return this.#removeOnClose; }
  set removeOnClose(value) { this.#removeOnClose = !!value; }

  get closeIgnoreElements() { return this.#closeIgnoreElements; }
  set closeIgnoreElements(value) {
    this.#closeIgnoreElements = Array.isArray(value) ? value : [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.#abort = new AbortController();
    this.#preventNavigation = this.hasAttribute('prevent-navigation');
  }
  

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
  }

  show() {
    this.showModal();
  }

  showModal() {
    this.setAttribute('open', '');
    this.#dialog.showModal();
    this.#showAfter();
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

  async #fullscreenClose(event) {
    if (this.#formState) {
      const prevent = await this.#formState.preventUnsavedChanges(event);
      if (prevent) return;
      this.#formState.reset();
    }
    
    this.close();
  }

  async #fullscreenSave(event) {
    if (!this.#formState.canSubmitForm(event)) return;
    this.#formState.formRequestSubmit(event);
    this.close();
  }

  #showAfter() {
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#handleEsc_bound, { signal: this.#abort.signal });

    if (!this.preventClose) {
      window.addEventListener('click', this.#clickOutsideClose_bound, { signal: this.#abort.signal, capture: true });
    }

    const content = this.shadowRoot.querySelector('[name="content"]');
    const isScroll = content.scrollHeight > 0 && content.offsetHeight !== content.scrollHeight;
    this.#dialog.classList.toggle('scroll', isScroll);

    if (this.querySelector('form')) {
      this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.addEventListener('click', this.#handleActionsClick_bound, { signal: this.#abort.signal })
      }
    }

    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });
    if (this.fullscreen) {
      this.shadowRoot.querySelector('.close-fullscreen').addEventListener('click', this.#fullscreenClose_bound, { signal: this.#abort.signal });
      if (this.#formState) {
        this.shadowRoot.querySelector('.save-fullscreen-form').addEventListener('click', this.#fullscreenSave_bound, { signal: this.#abort.signal });
        this.#formState.setInitialFormState();
      }
    }
    this.dispatchEvent(new Event('open', { bubbles: true }));
  }


  #handleSubmit(event) {
    const form = event.target;
    const { submitter } = event;
    if (form.method !== 'dialog' || !submitter) return;
    this.close(submitter.getAttribute('value') ?? this.returnValue);
  }

  #handleActionsClick(event) {
    this.close(event.target.getAttribute('value') ?? this.returnValue);
  }

  // for prevent navigation
  #beforeUnload(event) {
    event.preventDefault();
    event.returnValue = 'You may have unsaved changes';
  }

  async #handleClose() {
    this.removeAttribute('open');
    this.#dialog.removeEventListener('cancel', this.#handleCancel_bound);
    this.#dialog.removeEventListener('close', this.#handleClose_bound);
    window.removeEventListener('keydown', this.#handleEsc_bound);
    window.removeEventListener('click', this.#clickOutsideClose_bound);

    if (this.#preventNavigation) window.removeEventListener('beforeunload', this.#beforeUnload_bound);
    if (this.fullscreen) this.shadowRoot.querySelector('.close-fullscreen').removeEventListener('click', this.#fullscreenClose_bound);

    if (this.querySelector('form')) {
      this.removeEventListener('submit', this.#handleSubmit_bound);
    } else {
      const actions = this.querySelectorAll('[slot=actions]');
      for (const action of actions) {
        action.removeEventListener('click', this.#handleActionsClick_bound)
      }
    }

    if (this.removeOnClose) {
      await util.animationendAsync(this.#dialog);
      this.parentElement.removeChild(this);
    }
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
    let ignore = this.#closeIgnoreElements.find(e => e === event.target || e.contains(event.target));
    const shouldClose = !ignore && event.target !== this && !this.contains(event.target);
    if (shouldClose) {
      window.removeEventListener('click', this.#clickOutsideClose_bound);
      this.close();
    }
  }
}


customElements.define(MCDialogElement.tag, MCDialogElement);
