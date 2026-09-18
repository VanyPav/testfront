/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const GET_AM_FAQ_PDP_DATA_QUERY = `
  query GetAmFaqPdpData($sku: String) {
    getAmFaqSettings {
      allowGuestQuestions
    }
    getAmFaqProductQuestions(sku: $sku) {
      sectionTitle
      items {
        urlKey
        title
        answer
        metaTitle
        metaDescription
        position
        categoryUrlKeys
      }
    }
  }
`;
