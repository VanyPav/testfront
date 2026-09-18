/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import {
  Button,
  Checkbox,
  Icon,
  InLineAlert,
  Input,
  TextArea,
  provider as UI,
} from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import { rootLink } from '../commerce.js';
import { createElement } from './dom.js';
import { FaqRequestError, submitFaqQuestion } from './faq-fetch.js';

const CLASS_NAME = 'amasty-faq-ask-form';

const TEXT = {
  heading: 'Ask a question',
  question: 'Your question',
  questionPlaceholder: 'What would you like to know about this product?',
  name: 'Your name',
  email: 'Email',
  notify: 'Notify me by email when this question is answered',
  submit: 'Submit question',
  submitting: 'Sending…',
  successHeading: 'Thank you!',
  successDescription: 'Your question has been sent for moderation.',
  failureHeading: 'Your question was not sent',
  genericError: 'Something went wrong. Please try again later.',
  signIn: 'Sign in',
};

const VALIDATION_TEXT = {
  questionRequired: 'Please enter your question.',
  questionTooShort: 'Your question must be at least 10 characters long.',
  questionTooLong: 'Your question must not exceed 500 characters.',
  questionHasLink: 'Links are not allowed in a question. Please remove them.',
  emailInvalid: 'Please enter a valid email address.',
  emailRequiredForNotify: 'Please enter your email address so we can notify you.',
  tooLong: 'Please use no more than 255 characters.',
};

const QUESTION_MIN_LENGTH = 10;
const QUESTION_MAX_LENGTH = 500;
const FIELD_MAX_LENGTH = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_PATTERN = /(https?:\/\/|www\.)/i;
const FORBIDDEN_STATUS = 403;

/**
 * Statuses the FAQ action answers with on purpose, with a message written for
 * the shopper. Anything else — a 500, a transport failure, an unrecognised
 * shape — gets the universal message, because its text is not ours to show.
 */
const USER_FACING_STATUSES = new Set([400, 403, 429]);

const ALERT_ICONS = {
  success: 'CheckWithCircle',
  error: 'Warning',
};

const FOCUSABLE_FIELD_SELECTOR = 'input:not([type="hidden"]), textarea, select';

function focusFirstInvalidField(formElement) {
  const firstInvalidField = formElement.querySelector(`.${CLASS_NAME}__field--invalid`);

  if (!firstInvalidField) {
    return;
  }

  requestAnimationFrame(() => {
    const focusTarget = firstInvalidField.querySelector(FOCUSABLE_FIELD_SELECTOR);

    if (focusTarget) {
      focusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusTarget.focus({ preventScroll: true });

      return;
    }

    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function createFieldShell(labelText, { required = false } = {}) {
  const container = createElement('div', { className: `${CLASS_NAME}__field` });
  const label = createElement('p', { className: `${CLASS_NAME}__field-label` });
  const control = createElement('div', { className: `${CLASS_NAME}__field-control` });
  const errorMessage = createElement('p', { className: `${CLASS_NAME}__field-error` });

  label.textContent = labelText;
  errorMessage.hidden = true;

  if (required) {
    label.classList.add(`${CLASS_NAME}__field-label--required`);
  }

  container.append(label, control, errorMessage);

  return { container, control, errorMessage };
}

/**
 * The control is rendered once and keeps its value in a closure, the way the
 * custom form builder does it — re-rendering on every keystroke would cost the
 * caret its position.
 */
function createTextField({
  name,
  label,
  placeholder,
  required = false,
  multiline = false,
  maxLength = FIELD_MAX_LENGTH,
  validate = () => '',
}) {
  const { container, control, errorMessage } = createFieldShell(label, { required });
  let value = '';
  let hasError = false;

  /**
   * The drop-in controls hand their value over through an async callback, so the
   * closure can still be a keystroke behind when the form is submitted right
   * after typing. The rendered control is the one source that is never stale.
   */
  const readValue = () => control.querySelector('input, textarea')?.value ?? value;

  const setError = (message = '') => {
    hasError = Boolean(message);
    errorMessage.textContent = message;
    errorMessage.hidden = !hasError;
    container.classList.toggle(`${CLASS_NAME}__field--invalid`, hasError);
  };

  const field = {
    container,
    getValue: readValue,
    setError,
    validate: () => {
      setError(validate(readValue()));

      return !hasError;
    },
  };

  const onChangeValue = (nextValue) => {
    value = nextValue ?? '';

    if (hasError) {
      field.validate();
    }
  };

  const render = () => {
    control.textContent = '';

    if (multiline) {
      UI.render(TextArea, {
        name,
        value,
        placeholder,
        maxLength,
        onChange: (event) => onChangeValue(event?.target?.value),
      })(control);

      return;
    }

    UI.render(Input, {
      name,
      value,
      placeholder,
      maxLength,
      onValue: onChangeValue,
    })(control);
  };

  field.reset = () => {
    value = '';
    setError('');
    render();
  };

  render();

  return field;
}

function createCheckboxField({ name, label }) {
  const container = createElement('div', { className: `${CLASS_NAME}__field ${CLASS_NAME}__field--checkbox` });
  let checked = false;

  const render = () => {
    container.textContent = '';

    UI.render(Checkbox, {
      name,
      label,
      value: 'true',
      checked,
      onChange: (event) => {
        checked = Boolean(event?.currentTarget?.checked);
        render();
      },
    })(container);
  };

  render();

  return {
    container,
    getValue: () => checked,
    reset: () => {
      checked = false;
      render();
    },
  };
}

/**
 * Visually hidden rather than `type="hidden"`: a hidden input is trivial for a
 * bot to skip, while a field that is in the layout but off-screen gets filled.
 * Hidden from assistive technology and from tab order so no real person meets it.
 */
function createHoneypotField() {
  const container = createElement('div', { className: `${CLASS_NAME}__honeypot` });
  const label = createElement('label');
  const input = createElement('input');

  input.type = 'text';
  input.name = 'website';
  input.id = `${CLASS_NAME}__website`;
  input.tabIndex = -1;
  input.autocomplete = 'off';

  label.htmlFor = input.id;
  label.textContent = 'Website';

  container.setAttribute('aria-hidden', 'true');
  container.append(label, input);

  return {
    container,
    getValue: () => input.value,
    reset: () => {
      input.value = '';
    },
  };
}

function renderAlert(container, {
  type, heading, description, additionalActions,
}) {
  container.textContent = '';

  UI.render(InLineAlert, {
    type,
    heading,
    description,
    additionalActions,
    icon: createVNode(Icon, { source: ALERT_ICONS[type], size: '24' }),
    onDismiss: () => {
      container.textContent = '';
    },
  })(container);
}

function buildSubmitFailureAlert(error) {
  const status = error instanceof FaqRequestError ? error.status : undefined;
  // Only a sentence the action wrote for the shopper may be shown, and only for
  // the statuses where it means something. Everything else — a 500, a transport
  // failure, a body we could not read — gets the universal message, because the
  // raw text carries internal URLs and paths.
  const userMessage = USER_FACING_STATUSES.has(status) ? error.userMessage : '';
  const description = userMessage || TEXT.genericError;
  const alert = {
    type: 'error',
    heading: TEXT.failureHeading,
    description,
  };

  if (status === FORBIDDEN_STATUS) {
    alert.additionalActions = [{
      label: TEXT.signIn,
      onClick: () => {
        window.location.href = rootLink('/customer/login');
      },
    }];
  }

  return alert;
}

export default function createAskQuestionForm(sku) {
  const wrapper = createElement('div', { className: CLASS_NAME });
  const heading = createElement('h3', { className: `${CLASS_NAME}__heading` });
  const formElement = createElement('form', { className: `${CLASS_NAME}__form` });
  const fieldsContainer = createElement('div', { className: `${CLASS_NAME}__fields` });
  const submitContainer = createElement('div', { className: `${CLASS_NAME}__submit` });
  const alertContainer = createElement('div', { className: `${CLASS_NAME}__alert` });

  heading.textContent = TEXT.heading;
  formElement.noValidate = true;

  const notifyField = createCheckboxField({ name: 'notify', label: TEXT.notify });
  const questionField = createTextField({
    name: 'title',
    label: TEXT.question,
    placeholder: TEXT.questionPlaceholder,
    required: true,
    multiline: true,
    maxLength: QUESTION_MAX_LENGTH,
    validate: (value) => {
      const question = value.trim();

      if (!question) {
        return VALIDATION_TEXT.questionRequired;
      }

      if (question.length < QUESTION_MIN_LENGTH) {
        return VALIDATION_TEXT.questionTooShort;
      }

      if (question.length > QUESTION_MAX_LENGTH) {
        return VALIDATION_TEXT.questionTooLong;
      }

      // The action rejects links outright, so say so here instead of round-tripping.
      if (LINK_PATTERN.test(question)) {
        return VALIDATION_TEXT.questionHasLink;
      }

      return '';
    },
  });
  const nameField = createTextField({
    name: 'name',
    label: TEXT.name,
    validate: (value) => (value.trim().length > FIELD_MAX_LENGTH ? VALIDATION_TEXT.tooLong : ''),
  });
  const emailField = createTextField({
    name: 'email',
    label: TEXT.email,
    validate: (value) => {
      const email = value.trim();

      if (!email) {
        return notifyField.getValue() ? VALIDATION_TEXT.emailRequiredForNotify : '';
      }

      if (email.length > FIELD_MAX_LENGTH) {
        return VALIDATION_TEXT.tooLong;
      }

      return EMAIL_PATTERN.test(email) ? '' : VALIDATION_TEXT.emailInvalid;
    },
  });
  const honeypotField = createHoneypotField();
  const validatedFields = [questionField, nameField, emailField];

  // Read at render time, sent back untouched: the action refuses a submit that
  // arrives sooner than a person could plausibly have typed it.
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

  fieldsContainer.append(
    questionField.container,
    nameField.container,
    emailField.container,
    notifyField.container,
    honeypotField.container,
  );
  formElement.append(fieldsContainer, submitContainer, alertContainer);
  wrapper.append(heading, formElement);

  return wrapper;
}
