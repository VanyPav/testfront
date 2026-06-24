/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { Header, provider as UI } from '@dropins/tools/components.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { getCustomFormBuilderData, saveCustomFormBuilderData } from '../../scripts/amasty-custom-form-builder/custom-form-fetch.js';
import {
  createFormLayoutNodes,
  focusFirstInvalidField,
} from '../../scripts/amasty-custom-form-builder/helpers/domHelpers.js';
import buildSubmissionPayload from '../../scripts/amasty-custom-form-builder/helpers/form-values-resolver.js';
import { renderInputSettings } from '../../scripts/amasty-custom-form-builder/inputs-renderer.js';
import renderAlertBanner from '../../scripts/amasty-custom-form-builder/ui-form-elements/alert-banner.js';
import renderSubmitButton from '../../scripts/amasty-custom-form-builder/ui-form-elements/submit-button.js';

export default async function decorate(block) {
  const { 'form-id': formId = '' } = readBlockConfig(block);
  let data;

  if (!formId) {
    console.error('[amasty-custom-form-builder] Missing formId in block config.');
    block.remove();

    return;
  }

  try {
    data = await getCustomFormBuilderData(formId);

    if (!data || typeof data !== 'object') {
      throw new Error('[amasty-custom-form-builder] Invalid GraphQL response payload.');
    }

    if (!Array.isArray(data.inputSettings)) {
      throw new Error('[amasty-custom-form-builder] inputSettings must be an array.');
    }
  } catch (error) {
    console.error(error);
    block.remove();

    return;
  }

  const { title = '', inputSettings = [] } = data;
  const {
    wrapper,
    heading,
    formElement,
    alertContainer,
    fieldsContainer,
  } = createFormLayoutNodes();

  const submitButtonControl = renderSubmitButton('Submit');
  const { element: submitButton, setLoading: setSubmitButtonLoading } = submitButtonControl;
  const formState = renderInputSettings(inputSettings, fieldsContainer);
  let isSubmitting = false;

  const showFormStatusBanner = (type, bannerHeading, description = '') => {
    renderAlertBanner(alertContainer, type, bannerHeading, description);
  };

  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    setSubmitButtonLoading(true);
    alertContainer.textContent = '';

    try {
      const isValid = formState.validateFormFields();
      if (!isValid) {
        focusFirstInvalidField(formElement);
        return;
      }

      const formPayload = buildSubmissionPayload(inputSettings, formState.getValues());

      const response = await saveCustomFormBuilderData(formId, formPayload);
      if (response?.success) {
        showFormStatusBanner('success', response?.message || 'Form submitted successfully.');
      } else {
        showFormStatusBanner('warning', response?.message || 'Failed to submit the form.');
      }
    } catch (error) {
      console.error('[amasty-custom-form-builder] Failed to save form data.', error);
      showFormStatusBanner('warning', 'Something went wrong. Please try again later.');
    } finally {
      isSubmitting = false;
      setSubmitButtonLoading(false);
    }
  });

  formElement.append(fieldsContainer, submitButton, alertContainer);
  wrapper.append(heading, formElement);
  UI.render(Header, { title, level: 3 })(heading);

  block.textContent = '';
  block.append(wrapper);
}
