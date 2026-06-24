/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { InputDate, provider as UI } from '@dropins/tools/components.js';
import {
  normalizeControlValue,
  getFieldName,
  isFieldRequired,
} from '../helpers/domHelpers.js';

export default function renderDateTimePicker(input, mountNode, fieldState) {
  const settings = input?.settings ?? {};
  let value = normalizeControlValue(settings.defaultValue);

  fieldState.getValue = () => value;
  fieldState.showExternalError = false;

  const render = () => {
    mountNode.textContent = '';
    UI.render(InputDate, {
      name: getFieldName(input),
      value,
      required: isFieldRequired(input),
      error: fieldState.hasError ? fieldState.errorMessage : undefined,
      onChange: (event) => {
        value = event?.target?.value ?? '';
        fieldState.revalidate();
      },
    })(mountNode);
  };

  fieldState.onErrorChange = () => {
    render();
  };

  render();
}
