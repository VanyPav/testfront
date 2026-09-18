/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getCookie } from '@dropins/tools/lib.js';
import { checkIsAuthenticated } from '../commerce.js';

export default async function prefillFromAccount(nameField, emailField) {
  if (!checkIsAuthenticated()) {
    return;
  }

  const firstname = getCookie('auth_dropin_firstname');

  if (firstname && !nameField.getValue()) {
    nameField.setValue(firstname);
  }

  try {
    await import('../initializers/account.js');
    const { getCustomer } = await import('@dropins/storefront-account/api.js');
    const customer = await getCustomer();
    const email = customer?.email;

    if (email && !emailField.getValue()) {
      emailField.setValue(email);
    }
  } catch (error) {
    console.error('[amasty-faq] Could not prefill the customer email.', error);
  }
}
