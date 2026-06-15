/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import {
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { createElement } from '../helpers/domHelpers.js';

export default function renderSubmitButton(label = 'submit') {
  const submitContainer = createElement('div', { className: 'amasty-custom-form-builder__submit' });
  let isLoading = false;

  const renderButton = () => {
    UI.render(Button, {
      type: 'submit',
      children: label,
      active: isLoading,
      activeChildren: label,
      disabled: isLoading,
    })(submitContainer);
  };

  renderButton();

  return {
    element: submitContainer,
    setLoading: (nextLoading) => {
      isLoading = Boolean(nextLoading);
      renderButton();
    },
  };
}
