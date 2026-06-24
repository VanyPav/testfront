/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { RadioButton, provider as UI } from '@dropins/tools/components.js';
import {
  normalizeOptions,
  normalizeControlValue,
  getFieldName,
} from '../helpers/domHelpers.js';

export default function renderRadioButton(input, mountNode, fieldState) {
  const settings = input?.settings ?? {};
  const options = normalizeOptions(settings.options);
  const defaultValue = normalizeControlValue(settings.defaultValue);
  const fieldName = getFieldName(input);
  let selectedValue = defaultValue;

  const render = () => {
    mountNode.textContent = '';
    const groupNode = document.createElement('div');
    groupNode.className = 'amasty-custom-form-builder__option-group';

    options.forEach((option) => {
      const optionNode = document.createElement('div');
      UI.render(RadioButton, {
        name: fieldName,
        value: option.value,
        label: option.label,
        checked: normalizeControlValue(selectedValue) === normalizeControlValue(option.value),
        required: false,
        error: fieldState.hasError,
        onChange: () => {
          selectedValue = option.value;
          render();
        },
      })(optionNode);
      groupNode.append(optionNode);
    });

    mountNode.append(groupNode);
  };

  fieldState.getValue = () => selectedValue;
  fieldState.onErrorChange = () => {
    render();
  };

  render();
}
