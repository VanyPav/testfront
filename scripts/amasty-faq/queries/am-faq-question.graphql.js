/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const GET_AM_FAQ_QUESTION_QUERY = `
  query GetAmFaqQuestion($urlKey: String) {
    getAmFaqQuestion(urlKey: $urlKey) {
      found
      question {
        urlKey
        title
        answer
        categoryUrlKeys
      }
    }
  }
`;
