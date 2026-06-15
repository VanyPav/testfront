/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import renderTextField from './inputs-rendereres/text-field.js';
import renderTextarea from './inputs-rendereres/textarea.js';
import renderNumberInput from './inputs-rendereres/number-input.js';
import renderDateTimePicker from './inputs-rendereres/date-time-picker.js';
import renderDropdown from './inputs-rendereres/dropdown.js';
import renderRadioButton from './inputs-rendereres/radio-button.js';
import renderCheckbox from './inputs-rendereres/checkbox.js';
import validateRequiredFields from './validation/required-fields-validation.js';
import {
  getFieldName,
  getFieldLabel,
  isFieldRequired,
  createElement,
} from './helpers/domHelpers.js';

function renderUnsupportedField(input, mountNode) {
  const message = createElement('p');

  mountNode.textContent = '';
  message.textContent = `Unsupported field type: ${input?.type || 'unknown'}`;
  mountNode.append(message);
}

const renderers = {
  text_field: renderTextField,
  textarea: renderTextarea,
  number_input: renderNumberInput,
  date_time_picker: renderDateTimePicker,
  dropdown: renderDropdown,
  radio_button: renderRadioButton,
  checkbox: renderCheckbox,
};

function createFieldContainer(input) {
  const container = createElement('div', { className: 'amasty-custom-form-builder__field' });
  const label = createElement('p', { className: 'amasty-custom-form-builder__field-label' });

  if (isFieldRequired(input)) {
    label.classList.add('amasty-custom-form-builder__field-label--required');
  }

  label.textContent = getFieldLabel(input);

  const control = createElement('div', { className: 'amasty-custom-form-builder__field-control' });
  const validationMessage = createElement('p', { className: 'amasty-custom-form-builder__field-error', hidden: true });

  container.append(label, control, validationMessage);

  return { container, control, validationMessage };
}

export function renderInputSettings(inputSettings, rootNode) {
  rootNode.textContent = '';

  if (!Array.isArray(inputSettings)) {
    return {
      validateRequiredFields: () => true,
      getValues: () => ({}),
    };
  }

  const fieldStates = [];

  inputSettings.forEach((input) => {
    const { container, control, validationMessage } = createFieldContainer(input);
    const fieldState = {
      name: getFieldName(input),
      label: getFieldLabel(input),
      type: input?.type,
      required: isFieldRequired(input),
      validationRule: String(input?.settings?.validation || '').trim(),
      hasError: false,
      errorMessage: '',
      showExternalError: true,
      onErrorChange: null,
      getValue: () => '',
      setError: (message = '') => {
        const hasError = Boolean(message);
        fieldState.hasError = hasError;
        fieldState.errorMessage = message;
        if (fieldState.showExternalError) {
          validationMessage.textContent = message;
          validationMessage.hidden = !hasError;
        } else {
          validationMessage.textContent = '';
          validationMessage.hidden = true;
        }
        container.classList.toggle('amasty-custom-form-builder__field--invalid', hasError);
        if (typeof fieldState.onErrorChange === 'function') {
          fieldState.onErrorChange(hasError, message);
        }
      },
    };

    const renderer = renderers[input?.type] || renderUnsupportedField;
    renderer(input, control, fieldState);
    fieldStates.push(fieldState);
    rootNode.append(container);
  });

  function getValues() {
    return fieldStates.reduce((result, fieldState) => {
      result[fieldState.name] = fieldState.getValue();

      return result;
    }, {});
  }

  return {
    validateRequiredFields: () => validateRequiredFields(fieldStates),
    getValues,
  };
}
