/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import renderTextField from './text-field.js';

export default function renderNumberInput(input, mountNode, fieldState) {
  renderTextField(input, mountNode, fieldState, 'number');
}
