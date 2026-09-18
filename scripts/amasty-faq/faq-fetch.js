/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getConfigValue, getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { getCookie } from '@dropins/tools/lib.js';
import { GET_AM_FAQ_PDP_DATA_QUERY } from './queries/am-faq-pdp-data.graphql.js';
import { SUBMIT_AM_FAQ_QUESTION_MUTATION } from './queries/am-faq-submit-question.graphql.js';

const AUTH_TOKEN_COOKIE = 'auth_dropin_user_token';

/**
 * Carries whatever the mesh told us about a failure, split in two on purpose:
 * `message` is the full technical text and belongs in the console only — it
 * carries the runtime URL, the action path and the raw body. `userMessage` is
 * the one sentence the action itself wrote for the shopper, when it wrote one.
 * `status` is the HTTP status the action answered with — for the submit
 * mutation it is meaningful (400/403/429 are deliberate answers).
 */
class FaqRequestError extends Error {
  constructor(message, { status, userMessage, graphQlErrors = [] } = {}) {
    super(message);

    this.name = 'FaqRequestError';
    this.status = status;
    this.userMessage = userMessage;
    this.graphQlErrors = graphQlErrors;
  }
}

function getFaqEndpoint() {
  return getConfigValue('amasty.faq-endpoint');
}

function getAuthHeaders() {
  const token = getCookie(AUTH_TOKEN_COOKIE);

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isCustomerSignedIn() {
  return Boolean(getCookie(AUTH_TOKEN_COOKIE));
}

/**
 * A non-2xx answer from the action reaches us as a GraphQL error, so the status
 * has to be dug out of `extensions`. The shape differs between mesh versions —
 * read every place it is known to appear and give up quietly if it is in none.
 */
/**
 * The action's own answer for the shopper, as the mesh passes it through. Only
 * this text may reach the UI — `message` on the error never may.
 */
function readUserMessage(graphQlErrors) {
  return graphQlErrors
    .map((error) => error?.extensions?.responseJson?.error
      ?? error?.extensions?.responseJson?.message)
    .find((message) => typeof message === 'string' && message.trim());
}

function parseGraphQlErrors(body) {
  try {
    return JSON.parse(body)?.errors ?? [];
  } catch {
    return [];
  }
}

function readErrorStatus(graphQlErrors) {
  return graphQlErrors
    .map((error) => error?.extensions?.http?.status
      ?? error?.extensions?.response?.status
      ?? error?.extensions?.statusCode
      ?? error?.extensions?.status)
    .find((status) => Number.isInteger(status));
}

async function postGraphQl(query, variables, operationName) {
  const endpoint = getFaqEndpoint();

  if (!endpoint) {
    throw new FaqRequestError('[amasty-faq] Missing FAQ endpoint in config.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...getHeaders('cs'),
    ...getAuthHeaders(),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    credentials: 'omit',
    body: JSON.stringify({ query, variables, operationName }),
  });

  // A non-2xx answer still carries a GraphQL body, and that body holds the one
  // sentence meant for the shopper — dig it out before discarding the rest.
  if (!response.ok) {
    const errorText = await response.text();
    const graphQlErrors = parseGraphQlErrors(errorText);

    throw new FaqRequestError(`HTTP ${response.status}: ${errorText}`, {
      status: response.status,
      userMessage: readUserMessage(graphQlErrors),
      graphQlErrors,
    });
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    const message = payload.errors.map((error) => error.message).join('; ');

    throw new FaqRequestError(message, {
      status: readErrorStatus(payload.errors),
      userMessage: readUserMessage(payload.errors),
      graphQlErrors: payload.errors,
    });
  }

  return payload.data ?? {};
}

async function getFaqPdpData(sku) {
  if (!sku) {
    throw new FaqRequestError('[amasty-faq] Missing sku.');
  }

  const data = await postGraphQl(GET_AM_FAQ_PDP_DATA_QUERY, { sku }, 'GetAmFaqPdpData');

  return {
    settings: data.getAmFaqSettings ?? null,
    productQuestions: data.getAmFaqProductQuestions ?? null,
  };
}

async function submitFaqQuestion(input) {
  const data = await postGraphQl(SUBMIT_AM_FAQ_QUESTION_MUTATION, { input }, 'SubmitAmFaqQuestion');

  return data.submitAmFaqQuestion ?? null;
}

export {
  FaqRequestError,
  getFaqPdpData,
  isCustomerSignedIn,
  submitFaqQuestion,
};
