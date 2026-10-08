/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const GET_AM_FAQ_QUESTIONS_QUERY = `
  query GetAmFaqQuestions($page: Int) {
    getAmFaqQuestions(page: $page) {
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
