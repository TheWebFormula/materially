import MCSurfaceElement from '../surface/index.js';
import surfaceStyles from '../surface/component.css' assert { type: 'css' };
import styles from './component.css' assert { type: 'css' };
import { close_FILL0_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';


export default class MCDialogElement extends MCSurfaceElement {
  static tag = 'mc-dialog';
  static styleSheets = [surfaceStyles, styles];

  #abort;
  #preventNavigation = false;
  #handleSubmit_bound = this.#handleSubmit.bind(this);
  #handleClose_bound = this.#handleClose.bind(this);
  #beforeUnload_bound = this.#beforeUnload.bind(this);
  #handleActionsClick_bound = this.#handleActionsClick.bind(this);
  #close_bound = this.close.bind(this);


  constructor() {
    super();

    this.role = 'dialog';
    if (this.querySelector('[slot="icon"]')) this.shadowRoot.querySelector('.header').classList.add('has-icon');
    if (this.querySelector('[slot="actions"]')) this.shadowRoot.querySelector('[name=actions]').classList.add('has-actions');
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

  get preventNavigation() { return this.#preventNavigation; }
  set preventNavigation(value) {
    this.#preventNavigation = !!value;
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

  showModal() {
    super.showModal();

    const content = this.shadowRoot.querySelector('[name="content"]');
    const dialog = this.shadowRoot.querySelector('dialog');
    const isScroll = content.scrollHeight > 0 && content.offsetHeight !== content.scrollHeight;
    dialog.classList.toggle('scroll', isScroll);

    if (this.querySelector('form')) {
      this.addEventListener('submit', this.#handleSubmit_bound, { signal: this.#abort.signal });
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.addEventListener('click', this.#handleActionsClick_bound, { signal: this.#abort.signal })
      }
    }

    dialog.addEventListener('close', this.#handleClose_bound, { signal: this.#abort.signal });
    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound, { signal: this.#abort.signal });
    if (this.fullscreen) this.shadowRoot.querySelector('.close-fullscreen').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
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

  #handleClose() {
    const dialog = this.shadowRoot.querySelector('dialog');
    dialog.removeEventListener('close', this.#handleClose_bound);
    if (this.#preventNavigation) window.removeEventListener('beforeunload', this.#beforeUnload_bound);
    if (this.fullscreen) this.shadowRoot.querySelector('.close-fullscreen').removeEventListener('click', this.#close_bound);

    if (this.querySelector('form')) {
      this.removeEventListener('submit', this.#handleSubmit_bound);
    } else {
      const actions = this.querySelectorAll('[slot="actions"]');
      for (const action of actions) {
        action.removeEventListener('click', this.#handleActionsClick_bound)
      }
    }
  }
}


customElements.define(MCDialogElement.tag, MCDialogElement);
