/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getCookie } from '@dropins/tools/lib.js';
import { checkIsAuthenticated } from '../../commerce.js';

let accountEmailRequest;

async function getAccountEmail() {
  if (!checkIsAuthenticated()) {
    return '';
  }

  accountEmailRequest ??= (async () => {
    await import('../../initializers/account.js');
    const { getCustomer } = await import('@dropins/storefront-account/api.js');
    const customer = await getCustomer();

    return customer?.email || '';
  })().catch((error) => {
    console.error('[amasty-faq] Could not prefill the customer email.', error);
    accountEmailRequest = undefined;

    return '';
  });

  return accountEmailRequest;
}

export async function restoreAccountEmail(emailField) {
  const email = await getAccountEmail();

  if (email) {
    emailField.setValue(email);
  }
}

export default async function prefillFromAccount(nameField, emailField) {
  if (!checkIsAuthenticated()) {
    return;
  }

  const firstname = getCookie('auth_dropin_firstname');

  if (firstname && !nameField.getValue()) {
    nameField.setValue(firstname);
  }

  const email = await getAccountEmail();

  if (email && !emailField.getValue()) {
    emailField.setValue(email);
  }
}
