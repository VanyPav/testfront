/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { Picker, provider as UI } from '@dropins/tools/components.js';
import {
  normalizeOptions,
  normalizeControlValue,
  getFieldName,
  isFieldRequired,
} from '../helpers/domHelpers.js';

export default function renderDropdown(input, mountNode, fieldState) {
  const settings = input?.settings ?? {};
  const options = normalizeOptions(settings.options);
  const defaultValue = normalizeControlValue(settings.defaultValue);
  let value = defaultValue;

  fieldState.getValue = () => value;
  fieldState.showExternalError = true;

  const pickerOptions = options.map((option) => ({
    value: option.value,
    text: option.label,
  }));

  const render = () => {
    mountNode.textContent = '';
    UI.render(Picker, {
      name: getFieldName(input),
      placeholder: settings.placeholder || 'Select option',
      options: pickerOptions,
      value,
      required: isFieldRequired(input),
      error: fieldState.hasError,
      handleSelect: (event) => {
        value = event?.target?.value ?? '';
      },
    })(mountNode);
  };

  fieldState.onErrorChange = () => {
    render();
  };

  render();
}
