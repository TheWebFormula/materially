import { close_FILL1_wght400_GRAD0_opsz24 } from '../../helpers/svgs.js';
import util from '../../helpers/util.js';

const mcSnackbar = new class mcSnackbar {
  defaultTime = 3000;
  #currentSnackbar;
  #snackbarQueue = [];
  #idCounter = 0;


  show(params = {
    message: '',
    actionLabel: '',
    closeButton: true,
    time: this.defaultTime
  }) {
    if (!params.message) throw Error('Message required');
    if (params.closeButton === undefined) params.closeButton = true;

    const id = `mc-snackbar-${this.#idCounter++}`;
    document.body.insertAdjacentHTML('beforeend', /*html*/`
      <mc-snackbar id="${id}" ${params.twoLine ? 'class="two-line"' : ''} aria-label="[alert] ${params.message}">
        <div class="mc-text">${params.message}</div>
        ${!params.actionLabel ? '' : `<mc-button onclick="mcSnackbar.dismiss('action')">${params.actionLabel}</mc-button>`}
        ${!params.closeButton ? '' : `<mc-icon-button onclick="mcSnackbar.dismiss('close')"><mc-icon>${close_FILL1_wght400_GRAD0_opsz24}</mc-icon></mc-icon-button>`}
      </mc-snackbar>
    `);

    return new Promise(resolve => {
      this.#snackbarQueue.push({
        snackbar: document.querySelector(`#${id}`),
        resolve,
        time: params.time || this.defaultTime
      });
      this.#handleQueue();
    });
  }

  dismiss() {
    if (!this.#currentSnackbar) return;
    this.#currentSnackbar.snackbar.hidePopover();
  }

  #handleQueue() {
    if (this.#currentSnackbar) return;
    this.#currentSnackbar = this.#snackbarQueue.shift();
    if (!this.#currentSnackbar) return;

    const currentTimer = setTimeout(() => {
      this.#currentSnackbar.snackbar.hidePopover();
    }, this.#currentSnackbar.time);
    this.#currentSnackbar.snackbar.showPopover();

    const onClose = async (e) => {
      if (e.newState === 'open') return;

      this.#currentSnackbar.snackbar.removeEventListener('toggle', onClose);
      clearTimeout(currentTimer);
      this.#currentSnackbar.resolve();
      const currentRef = this.#currentSnackbar.snackbar;
      util.animationendAsync(currentRef).then(() => {
        currentRef.remove();
      });
      this.#currentSnackbar = undefined;
      
      setTimeout(() => {
        this.#handleQueue();
      }, 500);
    };

    this.#currentSnackbar.snackbar.addEventListener('toggle', onClose);
  }
}

window.mcSnackbar = mcSnackbar;
export default mcSnackbar;
