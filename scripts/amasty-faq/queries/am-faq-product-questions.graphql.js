/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const GET_AM_FAQ_PRODUCT_QUESTIONS_QUERY = `
  query GetAmFaqProductQuestions($sku: String) {
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
