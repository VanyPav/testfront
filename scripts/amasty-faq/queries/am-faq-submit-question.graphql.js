/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const SUBMIT_AM_FAQ_QUESTION_MUTATION = `
  mutation SubmitAmFaqQuestion($input: AmFaqSubmitQuestionRequest_Input!) {
    submitAmFaqQuestion(input: $input) {
      success
    }
  }
`;
