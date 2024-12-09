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
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (this.formHasChanges()) {
      const action = await dialog.simple({
        message: 'Discard changes?',
        actionConfirm: true,
        actionConfirmLabel: 'Cancel',
        actionCancel: true,
        actionCancelLabel: 'Discard'
      });
      if (action !== 'cancel') return true;
      this.#formState = undefined;
      return false;
    }
    return false;
  }

  canSubmitForm(event) {
    if (event.target.hasAttribute('formnovalidate')) return true;

    const formElements = [...this.#form.elements].filter(e => e.role !== 'button');
    // If form has inputs and there are not changes then prevent submit
    // NOTE: simple dialogs use forms to control the dialog element, that is why we need to check if there are any inputs. If not then the submit would not work
    if (formElements.length && !this.formHasChanges()) return false;

    // save if valid or configured for no validations
    const shouldValidate = !this.#form.hasAttribute('novalidate') && !event.target.hasAttribute('formnovalidate') && !this.#form.checkValidity();
    if (!shouldValidate) return true;

    // find first invalid field, report its validity (display change), scroll field into view
    const formElementsInvalid = formElements.filter(e => e.checkValidity);
    formElementsInvalid.forEach(element => element.reportValidity());
    const firstInvalid = formElementsInvalid.find(e => !e.checkValidity());
    const bounds = firstInvalid.getBoundingClientRect();
    if (!(bounds.y >= 0 && (bounds.y + bounds.height) <= window.innerHeight)) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    firstInvalid.focus({ preventScroll: true });
    return false;
  }

  formRequestSubmit(event) {
    const previousNoValidate = this.#form.noValidate;
    if (this.#form.hasAttribute('formnovalidate') || event.target.hasAttribute('formnovalidate')) this.#form.noValidate = true;
    // intercept submit so we can inject submitter
    this.#form.addEventListener('submit', (submitEvent) => {
      Object.defineProperty(submitEvent, 'submitter', {
        configurable: true,
        enumerable: true,
        get: () => event.target
      });
    }, { capture: true, once: true });

    // handled by component if needed. is used in mc-button
    // this.#internals.setFormValue(this.value);

    this.#form.requestSubmit();
    this.saveFormState();
    this.#form.noValidate = previousNoValidate;
  }

  reset() {
    this.#form.reset();
    this.saveFormState();
  }

  #getFormState() {
    return [...this.#form.elements].map(e => e.type === 'checkbox' ? e.checked : e.value).toString();
  }
}
