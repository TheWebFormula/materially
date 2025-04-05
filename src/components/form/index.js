import FormState from "../../helpers/form.js";

HTMLFormElement.prototype.track = function () {
  if (this.formState) return;
  this.formState = new FormState(this);
  this.addEventListener('focus', () => {
    this.formState.setInitialFormState();
  }, true);
}

const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
HTMLFormElement.prototype.requestSubmit = function (submitter) {
  if (!this.formState) return originalRequestSubmit.call(this);

  const canSubmit = this.formState.canSubmitForm(submitter);
  if (!canSubmit) return false;

  const previousNoValidate = this.noValidate;
  if (this.hasAttribute('formnovalidate') || (submitter && submitter.hasAttribute('formnovalidate'))) this.noValidate = true;

  this.addEventListener('submit', (submitEvent) => {
    Object.defineProperty(submitEvent, 'submitter', {
      configurable: true,
      enumerable: true,
      get: () => submitter
    });
  }, { capture: true, once: true });

  originalRequestSubmit.call(this);
  this.formState.saveFormState();
  this.noValidate = previousNoValidate;
}
