/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { VALIDATION_TEXT } from './ask-form-text.js';

export const QUESTION_MIN_LENGTH = 10;
export const QUESTION_MAX_LENGTH = 500;
export const FIELD_MAX_LENGTH = 255;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_PATTERN = /(https?:\/\/|www\.)/i;

export function validateQuestion(value) {
  const question = value.trim();

  if (!question) {
    return VALIDATION_TEXT.questionRequired;
  }

  if (question.length < QUESTION_MIN_LENGTH) {
    return VALIDATION_TEXT.questionTooShort;
  }

  if (question.length > QUESTION_MAX_LENGTH) {
    return VALIDATION_TEXT.questionTooLong;
  }

  if (LINK_PATTERN.test(question)) {
    return VALIDATION_TEXT.questionHasLink;
  }

  return '';
}

export function validateName(value) {
  return value.trim().length > FIELD_MAX_LENGTH ? VALIDATION_TEXT.tooLong : '';
}

export function validateEmail(value, wantsNotification) {
  const email = value.trim();

  if (!email) {
    return wantsNotification ? VALIDATION_TEXT.emailRequiredForNotify : '';
  }

  if (email.length > FIELD_MAX_LENGTH) {
    return VALIDATION_TEXT.tooLong;
  }

  return EMAIL_PATTERN.test(email) ? '' : VALIDATION_TEXT.emailInvalid;
}
