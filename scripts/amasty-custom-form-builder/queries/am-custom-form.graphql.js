/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

export const GET_AM_CUSTOM_FORM_QUERY = `
  query GetAmCustomForm($formId: String!) {
    getAmCustomFormById(formId: $formId) {
      title
      inputSettings
    }
  }
`;

export const SAVE_AM_CUSTOM_FORM_MUTATION = `
  mutation SaveAmCustomForm($input: AmastySaveCustomFormRequest_Input!) {
    saveAmCustomForm(input: $input) {
      success
      message
    }
  }
`;
