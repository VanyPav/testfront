/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { hasNonEmptyValue } from '../helpers/domHelpers.js';
import { validateCustomRule } from './validation-rules.js';

export function validateField(fieldState) {
  const value = fieldState.getValue();

  if (fieldState.required && !hasNonEmptyValue(value)) {
    fieldState.setError(`${fieldState.label} is required.`);
    return false;
  }

  const customValidationMessage = validateCustomRule({
    rule: fieldState.validationRule,
    value,
    label: fieldState.label,
    type: fieldState.type,
  });

  if (customValidationMessage) {
    fieldState.setError(customValidationMessage);
    return false;
  }

  fieldState.setError('');
  return true;
}

export default function validateFormFields(fieldStates) {
  let isValid = true;

  fieldStates.forEach((fieldState) => {
    if (!validateField(fieldState)) {
      isValid = false;
    }
  });

  return isValid;
}
