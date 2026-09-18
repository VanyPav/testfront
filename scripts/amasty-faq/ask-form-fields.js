/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import {
  Checkbox, Input, TextArea, provider as UI,
} from '@dropins/tools/components.js';
import { createElement } from './dom.js';
import { FIELD_MAX_LENGTH } from './ask-form-validation.js';

export const CLASS_NAME = 'amasty-faq-ask-form';

const FOCUSABLE_FIELD_SELECTOR = 'input:not([type="hidden"]), textarea, select';

export function focusFirstInvalidField(formElement) {
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

export function createTextField({
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

  let isVisible = true;

  const field = {
    container,
    getValue: readValue,
    setError,
    isVisible: () => isVisible,
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

  field.setValue = (nextValue) => {
    value = nextValue ?? '';
    render();
  };

  field.setVisible = (nextVisible) => {
    isVisible = Boolean(nextVisible);
    container.classList.toggle(`${CLASS_NAME}__field--hidden`, !isVisible);

    if (!isVisible) {
      setError('');
    }
  };

  render();

  return field;
}

export function createCheckboxField({ name, label, onChange = () => {} }) {
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
        onChange(checked);
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

export function createHoneypotField() {
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
