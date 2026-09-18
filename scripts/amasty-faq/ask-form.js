/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Button, provider as UI } from '@dropins/tools/components.js';
import { buildSubmitFailureAlert, renderAlert } from './ask-form-alert.js';
import {
  CLASS_NAME,
  createCheckboxField,
  createHoneypotField,
  createTextField,
  focusFirstInvalidField,
} from './ask-form-fields.js';
import prefillFromAccount from './ask-form-prefill.js';
import { TEXT } from './ask-form-text.js';
import {
  QUESTION_MAX_LENGTH,
  validateEmail,
  validateName,
  validateQuestion,
} from './ask-form-validation.js';
import { createElement } from './dom.js';
import { submitFaqQuestion } from './faq-fetch.js';

export default function createAskQuestionForm(sku) {
  const wrapper = createElement('div', { className: CLASS_NAME });
  const heading = createElement('h3', { className: `${CLASS_NAME}__heading` });
  const formElement = createElement('form', { className: `${CLASS_NAME}__form` });
  const fieldsContainer = createElement('div', { className: `${CLASS_NAME}__fields` });
  const submitContainer = createElement('div', { className: `${CLASS_NAME}__submit` });
  const alertContainer = createElement('div', { className: `${CLASS_NAME}__alert` });

  heading.textContent = TEXT.heading;
  formElement.noValidate = true;

  // Tracked separately from the checkbox field so the email validator can read it
  // without the two fields having to reference each other in a circle.
  let wantsNotification = false;
  const questionField = createTextField({
    name: 'title',
    label: TEXT.question,
    placeholder: TEXT.questionPlaceholder,
    required: true,
    multiline: true,
    maxLength: QUESTION_MAX_LENGTH,
    validate: validateQuestion,
  });
  const nameField = createTextField({
    name: 'name',
    label: TEXT.name,
    validate: validateName,
  });
  const emailField = createTextField({
    name: 'email',
    label: TEXT.email,
    validate: (value) => validateEmail(value, wantsNotification),
  });
  const notifyField = createCheckboxField({
    name: 'notify',
    label: TEXT.notify,
    onChange: (checked) => {
      wantsNotification = checked;
      emailField.setVisible(checked);
    },
  });
  const honeypotField = createHoneypotField();
  const validatedFields = [questionField, nameField, emailField];

  let formRenderedAt = Date.now();
  let isSubmitting = false;

  const renderSubmitButton = () => {
    UI.render(Button, {
      type: 'submit',
      children: TEXT.submit,
      active: isSubmitting,
      activeChildren: TEXT.submitting,
      disabled: isSubmitting,
    })(submitContainer);
  };

  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    alertContainer.textContent = '';

    const isValid = validatedFields
      .filter((field) => field.isVisible())
      .map((field) => field.validate())
      .every(Boolean);

    if (!isValid) {
      focusFirstInvalidField(formElement);

      return;
    }

    isSubmitting = true;
    renderSubmitButton();

    try {
      const result = await submitFaqQuestion({
        title: questionField.getValue().trim(),
        name: nameField.getValue().trim(),
        email: emailField.getValue().trim(),
        sku,
        notify: notifyField.getValue(),
        formRenderedAt,
        website: honeypotField.getValue(),
      });

      if (!result?.success) {
        throw new Error('[amasty-faq] submitAmFaqQuestion answered without success.');
      }

      [...validatedFields, notifyField, honeypotField].forEach((field) => field.reset());
      wantsNotification = false;
      emailField.setVisible(false);
      formRenderedAt = Date.now();

      renderAlert(alertContainer, {
        type: 'success',
        heading: TEXT.successHeading,
        description: TEXT.successDescription,
      });
    } catch (error) {
      console.error('[amasty-faq] Failed to submit a question.', error);
      renderAlert(alertContainer, buildSubmitFailureAlert(error));
    } finally {
      isSubmitting = false;
      renderSubmitButton();
    }
  });

  renderSubmitButton();

  emailField.setVisible(false);
  prefillFromAccount(nameField, emailField);

  fieldsContainer.append(
    questionField.container,
    nameField.container,
    notifyField.container,
    emailField.container,
    honeypotField.container,
  );
  formElement.append(fieldsContainer, submitContainer, alertContainer);
  wrapper.append(heading, formElement);

  return wrapper;
}
