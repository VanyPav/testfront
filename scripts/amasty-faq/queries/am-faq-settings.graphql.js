/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const GET_AM_FAQ_SETTINGS_QUERY = `
  query GetAmFaqSettings {
    getAmFaqSettings {
      faqPageTitle
      urlPrefix
      allowGuestQuestions
    }
  }
`;
