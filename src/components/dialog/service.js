import util from '../../helpers/util.js';

const mcDialog = new class mcDialog {
  #idCounter = 0;

  async simple(params = {
    headline: '',
    icon: '',
    message: '',
    preventClose: false,
    preventNavigation: false,
    actionConfirm: true,
    actionConfirmLabel: 'OK',
    actionCancel: false,
    actionCancelLabel: 'Cancel'
  }) {
    const actionConfirm = params.actionConfirm === undefined ? true : params.actionConfirm;
    const actionCancel = params.actionCancel || false;
    const id = `mc-dialog-${++this.#idCounter}`;
    const formId = `mc-dialog-form-${this.#idCounter}`;
    document.body.insertAdjacentHTML('beforeend', `
      <mc-dialog id="${id}" aria-label="[dialog] ${params.message}">
        ${!params.icon ? '' : `<mc-icon slot="icon">${params.icon}</mc-icon>`}
        ${!params.headline ? '' : `<div slot="headline">${params.headline}</div>`}
        <div slot="content">${params.message || ''}</div>
        <form id="${formId}" slot="content" method="dialog"></form>
        ${actionConfirm === true ? `<mc-button type="submit" slot="actions" form="${formId}" value="confirm">${params.actionConfirmLabel || 'OK'}</mc-button>` : ''}
        ${actionCancel === true ? `<mc-button slot="actions" form="${formId}" value="cancel">${params.actionCancelLabel || 'Cancel'}</mc-button>` : ''}
      </mc-dialog>
    `);
    const element = document.body.querySelector(`#${id}`);
    element.removeOnClose = true;
    element.preventClose = params.preventClose;
    // element.noScrim = params.noScrim === undefined ? false : params.noScrim;
    element.preventNavigation = !!params.preventNavigation;
    // await util.nextAnimationFrameAsync();
    
    const returnPromise = new Promise((resolve) => {
      element.addEventListener('close', () => {
        resolve(element.returnValue);
      });
    });
    element.showModal();

    return returnPromise
  }


  async template(params = {
    template,
    scrim: true,
    preventClose: false,
    preventNavigation: true
  }) {
    const id = `mc-dialog-${++this.#idCounter}`;
    document.body.insertAdjacentHTML('beforeend', `
      <mc-dialog id="${id}">
        ${params.template}
      </mc-dialog>
    `);
    const element = document.body.querySelector(`#${id}`);
    element.removeOnClose = true;
    element.preventClose = params.preventClose;
    element.scrim = params.scrim === undefined ? true : params.scrim;
    element.preventNavigation = !!params.preventNavigation;
    // await util.nextAnimationFrameAsync();
    
    const returnPromise = new Promise((resolve) => {
      element.addEventListener('close', () => {
        resolve(element.returnValue);
      });
    });
    element.showModal();

    return returnPromise
  }
};

window.mcDialog = mcDialog;
export default mcDialog;
