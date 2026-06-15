/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { Input, provider as UI } from '@dropins/tools/components.js';
import {
  normalizeControlValue,
  getFieldName,
  getFieldLabel,
  getMaxLength,
  isFieldRequired,
} from '../helpers/domHelpers.js';

export default function renderTextField(input, mountNode, fieldState, inputType = 'text') {
  const settings = input?.settings ?? {};
  let value = normalizeControlValue(settings.defaultValue);

  fieldState.getValue = () => value;
  fieldState.showExternalError = true;

  const render = () => {
    mountNode.textContent = '';
    UI.render(Input, {
      type: inputType,
      name: getFieldName(input),
      value,
      floatingLabel: getFieldLabel(input),
      placeholder: settings.placeholder || undefined,
      maxLength: getMaxLength(settings),
      required: isFieldRequired(input),
      error: fieldState.hasError,
      onValue: (nextValue) => {
        value = nextValue ?? '';
      },
    })(mountNode);
  };

  fieldState.onErrorChange = () => {
    render();
  };

  render();
}
