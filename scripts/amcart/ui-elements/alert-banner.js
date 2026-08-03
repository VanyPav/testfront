/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Abandoned Cart Recovery
 */

import { AlertBanner, Icon, provider as UI } from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';

const ALERT_VARIANTS = {
  success: 'success',
  warning: 'warning',
  error: 'warning',
};

const ALERT_ICON_SOURCES = {
  success: 'CheckWithCircle',
  warning: 'Warning',
};

function buildAlertMessage(heading, description = '') {
  const messageParts = [];

  if (heading) {
    messageParts.push(createVNode('strong', null, heading));
  }

  if (description) {
    messageParts.push(createVNode('div', null, description));
  }

  return createVNode('div', null, ...messageParts);
}

export default function renderAlertBanner(container, type, heading, description = '') {
  const variant = ALERT_VARIANTS[type] || 'warning';
  const iconSource = ALERT_ICON_SOURCES[variant];

  container.textContent = '';

  UI.render(AlertBanner, {
    variant,
    icon: createVNode(Icon, { source: iconSource, size: '24' }),
    message: buildAlertMessage(heading, description),
    onDismiss: () => {
      container.textContent = '';
    },
  })(container);
}
