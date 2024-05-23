import util from '../../helpers/util.js';

const wfcDialog = new class wfcDialog {
  #dialogStack = [];
  #idCounter = 0;

  async simple(params = {
    headline: '',
    icon: '',
    message: '',
    noScrim: false,
    allowClose: false,
    preventNavigation: false,
    actionConfirm: true,
    actionConfirmLabel: 'OK',
    actionCancel: false,
    actionCancelLabel: 'Cancel'
  }) {
    const actionConfirm = params.actionConfirm === undefined ? true : params.actionConfirm;
    const actionCancel = params.actionCancel || false;
    const id = `wfc-dialog-${this.#idCounter++}`;
    document.body.insertAdjacentHTML('beforeend', `
      <wfc-dialog id="${id}" aria-label="[dialog] ${params.message}">
        ${!params.icon ? '' : `<wfc-icon slot="icon">${params.icon}</wfc-icon>`}
        ${!params.headline ? '' : `<div slot="headline">${params.headline}</div>`}
        <div slot="content">${params.message || ''}</div>
        ${actionConfirm === true ? `<wfc-button slot="actions" onclick="wfcDialog.close('confirm')">${params.actionConfirmLabel || 'OK'}</wfc-button>` : ''}
        ${actionCancel === true ? `<wfc-button slot="actions" onclick="wfcDialog.close('cancel')">${params.actionCancelLabel || 'Cancel'}</wfc-button>` : ''}
      </wfc-dialog>
    `);
    const element = document.body.querySelector(`#${id}`);
    element.removeOnClose = true;
    element.allowClose = params.allowClose;
    element.noScrim = params.noScrim === undefined ? false : params.noScrim;
    element.preventNavigation = !!params.preventNavigation;
    await util.nextAnimationFrameAsync();
    return element.show();
  }


  async template(params = {
    template,
    scrim: true,
    allowClose: false,
    preventNavigation: true
  }) {
    const id = `wfc-dialog-${this.#idCounter++}`;
    document.body.insertAdjacentHTML('beforeend', `
      <wfc-dialog id="${id}">
        ${params.template}
      </wfc-dialog>
    `);
    const element = document.body.querySelector(`#${id}`);
    element.removeOnClose = true;
    element.allowClose = params.allowClose;
    element.scrim = params.scrim === undefined ? true : params.scrim;
    element.preventNavigation = !!params.preventNavigation;
    await util.nextAnimationFrameAsync();
    return element.show();
  }


  async close(returnValue) {
    const currentDialog = this.#dialogStack.pop();
    if (!currentDialog) throw Error('No dialog to close');
    return currentDialog.close(returnValue);
  }



  track(dialogElement) {
    if (dialogElement.nodeName !== 'WFC-DIALOG') throw Error('Can only track wfc-dialog elements');
    this.#dialogStack.push(dialogElement);
  }

  untrack(dialogElement) {
    const dialog = this.#dialogStack.find(({ element }) => element === dialogElement);
    if (!dialog) return;
    this.#dialogStack = this.#dialogStack.filter(({ element }) => element !== dialogElement);
  }
};

window.wfcDialog = wfcDialog;
export default wfcDialog;
