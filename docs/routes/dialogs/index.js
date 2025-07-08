import { Component } from '@thewebformula/lithe';
import { mcDialog } from '@thewebformula/materially/services';
import htmlTemplate from './page.html';
import settingsDialogTemplate from './settings-dialog.html';

class DialogsPage extends Component {
  static title = 'Dialogs';
  static htmlTemplate = htmlTemplate;

  preventClose = false;
  preventNavigation = true;

  constructor() {
    super();
  }

  async openSimple(preventClose = false, preventNavigation = true, icon, triggerElement) {
    const answer = await mcDialog.simple({
      icon,
      headline: 'Question',
      message: 'Are you sure?',
      actionCancel: true,
      preventClose,
      preventNavigation,
      triggerElement
    });

    if (answer === 'confirm') console.log('User pressed ok');
    if (answer === 'cancel') console.log('User pressed cancel');
  }

  async openTemplate() {
    const value = await mcDialog.template({
      template: `
      <div slot="headline">Headline</div>
      <form id="template-form" slot="content" method="dialog">
        <div>Here is some content for the dialog.</div>
      </form>
      <mc-button slot="actions" value="response value" form="template-form">Close</mc-button>
      `
    });
    console.log(value);
  }


  test1() {
    mcDialog.template({
      classes: ['settings-dialog'],
      preventClose: true,
      template: settingsDialogTemplate
    });

    const form = document.querySelector('#settings-form');
    form.querySelector('[name=id]').value = '123';
    form.querySelector('[name=resourceId]').value = '6436';
    form.querySelector('[name=label]').value = 'Label';
    form.querySelector('[name=required]').checked = true
    // form.formState.saveFormState();
  }

  test2() {
    const dialog = document.querySelector('#test2');
    dialog.showModal();

    const form = document.querySelector('#test2 #settings-form');
    form.querySelector('[name=id]').value = '123';
    form.querySelector('[name=resourceId]').value = '6436';
    form.querySelector('[name=label]').value = 'Label';
    form.querySelector('[name=required]').checked = true
  }
}
customElements.define('dialogs-page', DialogsPage);
