/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Icon, InLineAlert, provider as UI } from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import { rootLink } from '../commerce.js';
import { FaqRequestError } from './faq-fetch.js';
import { TEXT } from './ask-form-text.js';

const FORBIDDEN_STATUS = 403;
const USER_FACING_STATUSES = new Set([400, 403, 429]);

const ALERT_ICONS = {
  success: 'CheckWithCircle',
  error: 'Warning',
};

export function renderAlert(container, {
  type, heading, description, additionalActions,
}) {
  container.textContent = '';

  UI.render(InLineAlert, {
    type,
    heading,
    description,
    additionalActions,
    icon: createVNode(Icon, { source: ALERT_ICONS[type], size: '24' }),
    onDismiss: () => {
      container.textContent = '';
    },
  })(container);
}

export function buildSubmitFailureAlert(error) {
  const status = error instanceof FaqRequestError ? error.status : undefined;
  const userMessage = USER_FACING_STATUSES.has(status) ? error.userMessage : '';
  const description = userMessage || TEXT.genericError;
  const alert = {
    type: 'error',
    heading: TEXT.failureHeading,
    description,
  };

  if (status === FORBIDDEN_STATUS) {
    alert.additionalActions = [{
      label: TEXT.signIn,
      onClick: () => {
        window.location.href = rootLink('/customer/login');
      },
    }];
  }

  return alert;
}
