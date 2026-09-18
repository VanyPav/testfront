/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

/**
 * Product questions and the settings the block needs travel in one document:
 * the PDP always has to ask for the questions anyway, so the settings ride
 * along instead of costing a second round trip.
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
