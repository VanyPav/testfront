/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

/**
 * The mesh appends `_Input` to the request type of a mutation, so the input
 * type is `AmFaqSubmitQuestionRequest_Input` and not `AmFaqSubmitQuestionRequest`.
 */
export const SUBMIT_AM_FAQ_QUESTION_MUTATION = `
  mutation SubmitAmFaqQuestion($input: AmFaqSubmitQuestionRequest_Input!) {
    submitAmFaqQuestion(input: $input) {
      success
    }
  }
`;
