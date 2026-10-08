/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getConfigValue, getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { getCookie } from '@dropins/tools/lib.js';
import { GET_AM_FAQ_PDP_DATA_QUERY } from './queries/am-faq-pdp-data.graphql.js';
import { SUBMIT_AM_FAQ_QUESTION_MUTATION } from './queries/am-faq-submit-question.graphql.js';
import { buildFaqPageQuery } from './queries/am-faq-page.graphql.js';

const AUTH_TOKEN_COOKIE = 'auth_dropin_user_token';
const SETTINGS_CACHE_KEY = 'amasty-faq:settings';
const CATEGORIES_CACHE_KEY = 'amasty-faq:categories';
// The merchant guide promises admin changes reach the storefront within this time.
const CACHE_TTL_MS = 5 * 60 * 1000;

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

function createGraphQlError(errors) {
  return new FaqRequestError(errors.map((error) => error.message).join('; '), {
    status: readErrorStatus(errors),
    userMessage: readUserMessage(errors),
    graphQlErrors: errors,
  });
}

// One failed field does not discard the others; only a transport failure rejects.
async function postGraphQlPartial(query, variables, operationName) {
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

  return { data: payload.data ?? {}, errors: payload.errors ?? [] };
}

async function postGraphQl(query, variables, operationName) {
  const { data, errors } = await postGraphQlPartial(query, variables, operationName);

  if (errors.length) {
    throw createGraphQlError(errors);
  }

  return data;
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

function readCached(key) {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(key));

    return cached?.expiresAt > Date.now() ? cached.value : null;
  } catch {
    return null;
  }
}

function writeCached(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    }));
  } catch {
    // Storage unavailable (private mode, quota): refetched next time.
  }
}

function getCachedFaqSettings() {
  return readCached(SETTINGS_CACHE_KEY);
}

function getCachedFaqCategories() {
  return readCached(CATEGORIES_CACHE_KEY);
}

// A failed field comes back as `{ error }`, so the caller decides which failures matter: on a
// category page a failed `question` is irrelevant.
async function getFaqPageData(fieldNames, { urlKey, page } = {}, operationName = 'GetAmFaqPage') {
  if (fieldNames.length === 0) {
    return {};
  }

  const variables = {};

  if (fieldNames.includes('category') || fieldNames.includes('question')) {
    variables.urlKey = urlKey;
  }

  if (fieldNames.includes('category') || fieldNames.includes('questions')) {
    variables.page = page;
  }

  const { data, errors } = await postGraphQlPartial(
    buildFaqPageQuery(fieldNames, operationName),
    variables,
    operationName,
  );
  // An error without a path (a rejected document, say) belongs to every field.
  const result = Object.fromEntries(fieldNames.map((name) => {
    const fieldErrors = errors.filter((error) => !error.path || error.path[0] === name);

    return [name, fieldErrors.length ? { error: createGraphQlError(fieldErrors) } : data[name]];
  }));

  if (result.settings && !result.settings.error) {
    writeCached(SETTINGS_CACHE_KEY, result.settings);
  }

  if (result.categories && !result.categories.error) {
    result.categories = result.categories.items ?? [];
    writeCached(CATEGORIES_CACHE_KEY, result.categories);
  }

  return result;
}

export {
  FaqRequestError,
  getCachedFaqCategories,
  getCachedFaqSettings,
  getFaqPageData,
  getFaqPdpData,
  isCustomerSignedIn,
  submitFaqQuestion,
};
