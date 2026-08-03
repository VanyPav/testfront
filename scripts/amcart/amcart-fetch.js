/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Abandoned Cart Recovery
 */

import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';

function getVerifyCartTokenEndpoint() {
  return getConfigValue('amasty.acart-verify-token-endpoint');
}

async function verifyCartToken(token) {
  const endpoint = getVerifyCartTokenEndpoint();

  if (!endpoint) {
    throw new Error('[amcart] Missing acart verify token endpoint in config.');
  }

  const url = new URL(endpoint);
  url.searchParams.set('token', token);

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  return payload;
}

export { verifyCartToken };
