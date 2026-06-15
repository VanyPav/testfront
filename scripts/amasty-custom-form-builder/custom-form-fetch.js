/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { getConfigValue, getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { getCookie } from '@dropins/tools/lib.js';
import { GET_AM_CUSTOM_FORM_QUERY, SAVE_AM_CUSTOM_FORM_MUTATION } from './queries/am-custom-form.graphql.js';

function getCustomFormBuilderEndpoint() {
  return getConfigValue('amasty.custom-form-builder-endpoint');
}

function getAuthHeaders() {
  const token = getCookie('auth_dropin_user_token');

  return token ? { Authorization: `Bearer ${token}` } : {};
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

async function getCustomFormBuilderData(formId) {
  if (!formId) {
    throw new Error('[amasty-custom-form-builder] Missing formId in block config.');
  }

  const endpoint = getCustomFormBuilderEndpoint();

  if (!endpoint) {
    throw new Error('[amasty-custom-form-builder] Missing custom form builder endpoint in config.');
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
    body: JSON.stringify({
      query: GET_AM_CUSTOM_FORM_QUERY,
      variables: { formId },
      operationName: 'GetAmCustomForm',
    }),
  });

  const payload = await handleGraphQlResponseErrors(response);
  const form = payload.data?.getAmCustomFormById;

  if (!form) {
    throw new Error(`No data for form with id: ${formId}`);
  }

  return form;
}

async function saveCustomFormBuilderData(formId, formData) {
  if (!formId) {
    throw new Error('[amasty-custom-form-builder] Missing formId in block config.');
  }

  const endpoint = getCustomFormBuilderEndpoint();
  if (!endpoint) {
    throw new Error('[amasty-custom-form-builder] Missing custom form builder endpoint in config.');
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
    body: JSON.stringify({
      query: SAVE_AM_CUSTOM_FORM_MUTATION,
      variables: {
        input: {
          formId,
          formData: formData ?? [],
        },
      },
      operationName: 'SaveAmCustomForm',
    }),
  });

  const payload = await handleGraphQlResponseErrors(response);

  return payload.data?.saveAmCustomForm;
}

export {
  getCustomFormBuilderData,
  saveCustomFormBuilderData,
};
