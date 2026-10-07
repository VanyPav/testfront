/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const GET_AM_FAQ_CATEGORY_QUERY = `
  query GetAmFaqCategory($urlKey: String, $page: Int) {
    getAmFaqCategory(urlKey: $urlKey, page: $page) {
      found
      category {
        urlKey
        title
      }
      items {
        urlKey
        title
        answer
        position
      }
      page
      pageSize
      total
    }
  }
`;
