import { Component } from '@thewebformula/lithe';
import { mcDialog } from '@thewebformula/materially/services';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Dialogs';
  static htmlTemplate = htmlTemplate;

  allowClose = false;
  preventNavigation = true;

  constructor() {
    super();
  }

  async openSimple(allowClose = false, preventNavigation = true, icon) {
    const answer = await mcDialog.simple({
      icon,
      headline: 'Question',
      message: 'Are you sure?',
      actionCancel: true,
      allowClose,
      preventNavigation
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
}
