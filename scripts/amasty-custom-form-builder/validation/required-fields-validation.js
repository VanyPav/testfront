/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { hasNonEmptyValue } from '../helpers/domHelpers.js';
import { validateCustomRule } from './validation-rules.js';

export default function validateRequiredFields(fieldStates) {
  let isValid = true;

  fieldStates.forEach((fieldState) => {
    fieldState.setError('');

    if (!fieldState.required) {
      return;
    }

    if (!hasNonEmptyValue(fieldState.getValue())) {
      fieldState.setError(`${fieldState.label} is required.`);
      isValid = false;

      return;
    }

    const customValidationMessage = validateCustomRule({
      rule: fieldState.validationRule,
      value: fieldState.getValue(),
      label: fieldState.label,
      type: fieldState.type,
    });

    if (customValidationMessage) {
      fieldState.setError(customValidationMessage);
      isValid = false;
    }
  });

  return isValid;
}
