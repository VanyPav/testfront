/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getConfigValue, getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { GET_AM_FAQ_PRODUCT_QUESTIONS_QUERY } from './queries/am-faq-product-questions.graphql.js';

function getFaqEndpoint() {
  return getConfigValue('amasty.faq-endpoint');
}

async function handleGraphQlResponseErrors(response) {
  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const message = payload.errors.map((e) => e.message).join('; ');

    throw new Error(message);
  }

  return payload;
}

async function getFaqProductQuestions(sku) {
  if (!sku) {
    throw new Error('[amasty-faq] Missing sku.');
  }

  const endpoint = getFaqEndpoint();

  if (!endpoint) {
    throw new Error('[amasty-faq] Missing FAQ endpoint in config.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...getHeaders('cs'),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    credentials: 'omit',
    body: JSON.stringify({
      query: GET_AM_FAQ_PRODUCT_QUESTIONS_QUERY,
      variables: { sku },
      operationName: 'GetAmFaqProductQuestions',
    }),
  });

  const payload = await handleGraphQlResponseErrors(response);

  return payload.data?.getAmFaqProductQuestions ?? null;
}

export {
  getFaqProductQuestions,
};
