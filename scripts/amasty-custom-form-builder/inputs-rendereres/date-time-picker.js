/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { InputDate, provider as UI } from '@dropins/tools/components.js';
import {
  normalizeControlValue,
  getFieldName,
  getFieldLabel,
  isFieldRequired,
} from '../helpers/domHelpers.js';

export default function renderDateTimePicker(input, mountNode, fieldState) {
  const settings = input?.settings ?? {};
  let value = normalizeControlValue(settings.defaultValue);

  fieldState.getValue = () => value;

  mountNode.textContent = '';
  UI.render(InputDate, {
    name: getFieldName(input),
    value,
    label: getFieldLabel(input),
    required: isFieldRequired(input),
    onChange: (event) => {
      value = event?.target?.value ?? '';
    },
  })(mountNode);
}
