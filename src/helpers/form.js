import dialog from '../components/dialog/service.js';

export default class FormState {
  #form;
  #formState;

  constructor(form) {
    this.#form = form;
  }

  setInitialFormState() {
    if (this.#formState !== undefined) return;
    this.saveFormState();
  }

  saveFormState() {
    this.#formState = this.#getFormState();
  }

  formHasChanges() {
    const currentState = this.#getFormState();
    return this.#formState !== undefined && currentState !== this.#formState;
  }

  async preventUnsavedChanges(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    if (this.formHasChanges()) {
      const action = await dialog.simple({
        message: 'Discard changes?',
        actionConfirm: true,
        actionConfirmLabel: 'Cancel',
        actionCancel: true,
        actionCancelLabel: 'Discard'
      });
      if (action !== 'cancel') return true;
      // TODO should we reset. The issue is this resets to the value prop not the last state
      // this.#form.reset();
      return false;
    }
    return false;
  }

  canSubmitForm(submitter) {
    if (submitter && submitter.hasAttribute('formnovalidate') || this.#form.hasAttribute('novalidate')) return true;
    const formElements = [...this.#form.elements].filter(e => e.role !== 'button');

    // find first invalid field, report its validity (display change), scroll field into view
    const formElementsInvalid = formElements.filter(e => e.checkValidity);
    formElementsInvalid.forEach(element => element.reportValidity());
    const firstInvalid = formElementsInvalid.find(e => !e.checkValidity());
    if (!firstInvalid) return true;

    const bounds = firstInvalid.getBoundingClientRect();
    if (!(bounds.y >= 0 && (bounds.y + bounds.height) <= window.innerHeight)) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    firstInvalid.focus({ preventScroll: true });
    return false;
  }

  reset() {
    this.#form.reset();
    this.saveFormState();
  }

  #getFormState() {
    return [...this.#form.elements].map(e => e.type === 'checkbox' ? e.checked : e.value).toString();
  }
}
