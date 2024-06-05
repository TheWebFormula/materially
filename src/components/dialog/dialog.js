import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../helpers/util.js';
import dialogService from './service.js';
import { close_FILL0_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';


export default class MCDialogElement extends HTMLComponentElement {
  static tag = 'mc-dialog';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #dialog;
  #allowClose = false;
  #removeOnClose = false;
  #preventNavigation = false;
  #handleSubmit_bound = this.#handleSubmit.bind(this);
  #handleCancel_bound = this.#handleCancel.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #beforeUnload_bound = this.#beforeUnload.bind(this);
  #handleActionsClick_bound = this.#handleActionsClick.bind(this);
  #fullscreenCloseClick_bound = this.#fullscreenCloseClick.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    this.render();
    this.#dialog = this.shadowRoot.querySelector('dialog');
    if (this.querySelector('[slot="icon"]')) this.shadowRoot.querySelector('.header').classList.add('has-icon');
  }

  template() {
    return /*html*/`
      <dialog>
        <!-- <div class="background"></div> -->
        <div class="header">
          <slot name="icon"></slot>
          <slot name="headline"></slot>
          <mc-icon class="close-fullscreen">${close_FILL0_wght400_GRAD0_opsz24}</mc-icon>
        </div>
        <slot name="content"></slot>
        <slot name="actions"></slot>
      </dialog>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['allow-close', 'boolean'],
      ['remove-on-close', 'boolean'],
      ['no-scrim', 'boolean'],
      ['prevent-navigation', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();

    // this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }

  get open() { return this.hasAttribute('open'); }

  get allowClose() { return this.#allowClose; }
  set allowClose(value) { this.#allowClose = !!value; }

  get removeOnClose() { return this.#removeOnClose; }
  set removeOnClose(value) { this.#removeOnClose = !!value; }

  get preventNavigation() { return this.#preventNavigation; }
  set preventNavigation(value) {
    this.#preventNavigation = !!value;
  }

  // TODO close animation

  // TODO no animation
  show() {
    this.setAttribute('open', '');
    this.#dialog.show();
    // this.style.setProperty('--mc-dialog-height', `${Math.max(140, this.offsetHeight)}px`);
    // this.style.setProperty('--mc-dialog-height-transition-duration', this.offsetHeight < 200 ? '200ms' : '');

    this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });
  }

  showModal() {
    const paddingHeight = 48;
    const content = this.shadowRoot.querySelector('[name="content"]');
    // TODO rework so overflow is managed in animation?
    const isScroll = content.scrollHeight > 0 && content.offsetHeight !== content.scrollHeight;
    const contentHeight = isScroll ? content.scrollHeight + content.offsetHeight : content.offsetHeight;
    this.#dialog.classList.toggle('scroll', isScroll);
    const height = Math.min(560, paddingHeight + contentHeight + this.shadowRoot.querySelector('.header').offsetHeight + this.shadowRoot.querySelector('[name="actions"]').offsetHeight);
    this.style.setProperty('--mc-dialog-height', `${Math.max(140, height)}px`);
    const duration = Math.min(500, height * 1.2);
    this.style.setProperty('--mc-dialog-height-transition-duration', `${duration}ms`);
    
    this.setAttribute('open', '');
    this.#dialog.showModal();

    if (this.querySelector('form')) {
      this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.addEventListener('click', this.#handleActionsClick_bound, { signal: this.#abort.signal })
      }
    }

    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });
  }

  showFullscreen() {
    this.classList.add('fullscreen');
    this.setAttribute('open', '');
    this.#dialog.showModal();

    if (this.querySelector('form')) {
      this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.addEventListener('click', this.#handleActionsClick_bound, { signal: this.#abort.signal })
      }
    }
    this.#dialog.querySelector('.close-fullscreen').addEventListener('click', this.#fullscreenCloseClick_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });
  }

  close(returnValue) {
    const previousReturnValue = this.returnValue;
    this.returnValue = returnValue;

    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      this.returnValue = previousReturnValue;
      return;
    }

    this.#dialog.close(returnValue);
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

  #fullscreenCloseClick() {
    this.close();
  }

  #handleClose() {
    this.removeAttribute('open');
    this.#dialog.removeEventListener('cancel', this.#handleCancel_bound);
    this.#dialog.removeEventListener('close', this.#handleClose_bound);
    this.#dialog.querySelector('.close-fullscreen').removeEventListener('click', this.#fullscreenCloseClick_bound);
    if (this.#preventNavigation) window.removeEventListener('beforeunload', this.#beforeUnload_bound);

    if (this.querySelector('form')) {
      this.removeEventListener('submit', this.#handleSubmit_bound);
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.removeEventListener('click', this.#handleActionsClick_bound)
      }
    }

    if (this.removeOnClose) this.parentElement.removeChild(this);
  }

  #handleCancel(event) {
    if (!this.#allowClose) {
      event.preventDefault();
      return;
    }

    const preventClose = !this.dispatchEvent(new Event('close', { cancelable: true }));
    if (preventClose) {
      event.preventDefault();
      return;
    }

    const preventCancel = !this.dispatchEvent(new Event('cancel', { cancelable: true }));
    if (preventCancel) event.preventDefault();
  }

  // for prevent navigation
  #beforeUnload(event) {
    event.preventDefault();
    event.returnValue = 'You may have unsaved changes';
  }


  #slotChange(event) {
    const name = event.target.getAttribute('name');
    if (name === 'icon' && event.target.assignedElements().length > 0) {
      this.shadowRoot.querySelector('dialog .header').classList.add('has-icon');
    }

    // if (name === 'actions') {
    //   this.shadowRoot.querySelector('dialog slot[name="actions"]').classList.toggle('not-empty', event.target.assignedElements().length > 0);
    // }

    // if (name === 'headline' || name === 'icon') {
    //   const empty = this.shadowRoot.querySelector('dialog slot[name="icon"]').assignedElements().length === 0 && this.shadowRoot.querySelector('dialog slot[name="headline"]').assignedElements().length === 0;
    //   this.shadowRoot.querySelector('dialog .header').classList.toggle('not-empty', !empty);
    // }
  }
}




class MCDialogElement1 extends HTMLComponentElement {
  static tag = 'mc-dialog';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = [styles];

  #abort;
  #open = false;
  #dialog;
  #allowClose = false;
  #focusableElements = [];
  #focusableIndex = -1;
  #returnValue;
  #scrim = true;
  #scrimElement;
  #removeOnClose = false;
  #fullscreen = false;
  #preventNavigation = false;
  #closePromise;
  #closePromiseResolve;
  #slotChange_bound = this.#slotChange.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #handleKeydown_bound = this.#handleKeydown.bind(this);
  #handleCancel_bound = this.#handleCancel.bind(this);
  #handleSubmit_bound = this.#handleSubmit.bind(this);
  #closeClick_bound = this.#closeClick.bind(this);
  #beforeUnload_bound = this.#beforeUnload.bind(this);

  constructor() {
    super();

    this.role = 'dialog';
    this.render();
    this.#dialog = this.shadowRoot.querySelector('dialog');
    this.#scrimElement = this.shadowRoot.querySelector('.scrim');
  }

  template() {
    return /*html*/`
      <dialog>
        <div class="background"></div>
        <div class="header">
          <slot name="icon"></slot>
          <slot name="headline"></slot>
          <mc-icon class="close-fullscreen">${close_FILL0_wght400_GRAD0_opsz24}</mc-icon>
        </div>
        <slot name="content"></slot>
        <slot name="actions"></slot>
      </dialog>
      <div class="scrim"></div>
    `;
  }


  connectedCallback() {
    this.#abort = new AbortController();
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    dialogService.untrack(this);
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
  }

  static get observedAttributesExtended() {
    return [
      ['allow-close', 'boolean'],
      ['remove-on-close', 'boolean'],
      ['no-scrim', 'boolean'],
      ['prevent-navigation', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get returnValue() { return this.#returnValue; }
  set returnValue(value) { this.#returnValue = value; }

  get removeOnClose() { return this.#removeOnClose; }
  set removeOnClose(value) { this.#removeOnClose = !!value; }

  get allowClose() { return this.#allowClose; }
  set allowClose(value) { this.#allowClose = !!value; }

  get noScrim() { return this.#scrim; }
  set noScrim(value) {
    this.#scrim = !value;
    this.#scrimElement.classList.toggle('hide', !this.#scrim);
  }

  get preventNavigation() { return this.#preventNavigation; }
  set preventNavigation(value) {
    this.#preventNavigation = !!value;
  }

  get open() { return this.#open; }
  set open(value) {
    this.#open = !!value;
    if (open) {
      this.setAttribute('open', '');
      this.show();
    } else {
      this.removeAttribute('open');
      this.close();
    }
  }


  async show() {
    if (this.#open) return;
    this.#dialog.showModal();
    // hide indicator focus from HTMLDialogElement auto focus
    document.activeElement.hideFocus();
    this.#dialog.classList.add('open');
    this.#dialog.style.setProperty('--mc-dialog-height', `${this.#dialog.offsetHeight}px`);
    this.#dialog.style.setProperty('--mc-dialog-height-transition-duration', this.#dialog.offsetHeight < 200 ? '200ms' : '');
    const content = this.#dialog.querySelector('slot[name="content"]');
    const dialogBounds = this.#dialog.getBoundingClientRect();
    const isScroll = (content.offsetHeight + content.scrollHeight + this.#dialog.querySelector('slot[name="actions"]').offsetHeight) > dialogBounds.bottom;
    this.#dialog.classList.toggle('scroll', isScroll);
    this.#dialog.classList.add('animating');
    this.setAttribute('open', '');
    this.#open = true;
    util.animationendAsync(this.#dialog).then(() => {
      this.#dialog.classList.remove('animating');
    });

    this.#dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('cancel', this.#handleCancel_bound, { signal: this.#abort.signal });
    this.#dialog.addEventListener('keydown', this.#handleKeydown_bound, { signal: this.#abort.signal });
    this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    if (this.#allowClose) this.#dialog.addEventListener('click', this.#closeClick_bound, { signal: this.#abort.signal });
    if (this.#fullscreen) this.#dialog.querySelector('.header .close-fullscreen').addEventListener('click', this.#closeClick_bound, { signal: this.#abort.signal });
    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });

    this.#focusableIndex = -1;
    this.#focusableElements = [...this.querySelectorAll('mc-button:not(disabled)'), ...this.querySelectorAll('button:not(disabled)')];
    if (document.activeElement) this.#focusableIndex = this.#focusableElements.indexOf[document.activeElement];
    dialogService.track(this);
    this.#closePromise = new Promise(resolve => this.#closePromiseResolve = resolve);
    return this.#closePromise;
  }


  async close(returnValue) {
    if (!this.#open) return;

    this.#dialog.removeEventListener('close', this.#handleClose_bound);
    this.#dialog.removeEventListener('cancel', this.#handleCancel_bound);
    this.#dialog.removeEventListener('keydown', this.#handleKeydown_bound);
    this.removeEventListener('submit', this.#handleSubmit_bound);
    if (this.#allowClose) this.#dialog.removeEventListener('click', this.#closeClick_bound);
    if (this.#fullscreen) this.#dialog.querySelector('.header .close-fullscreen').removeEventListener('click', this.#closeClick_bound);
    if (this.#preventNavigation) window.removeEventListener('beforeunload', this.#beforeUnload_bound);

    dialogService.untrack(this);
    this.dispatchEvent(new Event('close', { cancelable: true }));

    this.returnValue = returnValue;
    this.#dialog.classList.add('animating');
    this.#dialog.classList.remove('open');
    this.#open = false;
    await util.animationendAsync(this.#dialog);
    this.#dialog.classList.remove('animating');
    this.removeAttribute('open');
    this.#dialog.close(returnValue);

    if (typeof this.#closePromiseResolve === 'function') {
      this.#closePromiseResolve(this.#returnValue);
      this.#closePromise = undefined;
      this.#closePromiseResolve = undefined;
    }
    if (this.removeOnClose) this.parentElement.removeChild(this);
    // hide indicator focus from HTMLDialogElement auto focus
    document.activeElement.hideFocus();
  }


  #handleSubmit(event) {
    const form = event.target;
    const { submitter } = event;
    if (form.method !== 'dialog' || !submitter) return;
    this.close(submitter.getAttribute('value') ?? this.returnValue);
  }

  #handleCancel() {
    this.dispatchEvent(new Event('cancel', { cancelable: true }));
    this.close();
  }

  #handleClose() {
    this.close();
  }

  #handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.#allowClose) {
        this.dispatchEvent(new Event('cancel', { cancelable: true }));
        this.close();
      }
    } else if (event.shiftKey && event.code === 'Tab') {
      this.#focusableIndex -= 1;
      if (!this.#focusableElements[this.#focusableIndex]) this.#focusableIndex = this.#focusableElements.length - 1;
      if (this.#focusableElements[this.#focusableIndex]) this.#focusableElements[this.#focusableIndex].focus();
      event.preventDefault();
    } else if (event.code === 'Tab') {
      this.#focusableIndex += 1;
      if (!this.#focusableElements[this.#focusableIndex]) this.#focusableIndex = 0;
      if (this.#focusableElements[this.#focusableIndex]) this.#focusableElements[this.#focusableIndex].focus();
      event.preventDefault();
    }
  }

  #slotChange(event) {
    const name = event.target.getAttribute('name');
    if (name === 'icon' && event.target.assignedElements().length > 0) {
      this.shadowRoot.querySelector('dialog .header').classList.add('has-icon');
    }

    if (name === 'actions') {
      this.shadowRoot.querySelector('dialog slot[name="actions"]').classList.toggle('not-empty', event.target.assignedElements().length > 0);
    }

    if (name === 'headline' || name === 'icon') {
      const empty = this.shadowRoot.querySelector('dialog slot[name="icon"]').assignedElements().length === 0 && this.shadowRoot.querySelector('dialog slot[name="headline"]').assignedElements().length === 0;
      this.shadowRoot.querySelector('dialog .header').classList.toggle('not-empty', !empty);
    }
  }

  #closeClick(event) {
    if (event.target !== this.#dialog && !event.target.classList.contains('close-fullscreen')) return;
    this.close();
  }

  // for prevent navigation
  #beforeUnload(event) {
    event.preventDefault();
    event.returnValue = 'You may have unsaved changes';
  }
};

customElements.define(MCDialogElement.tag, MCDialogElement);
