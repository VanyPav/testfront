/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

const RULE_PATTERNS = {
  letters: /^\p{L}+$/u,
  alpha_numeric: /^[\p{L}\d]+$/u,
  integer: /^-?\d+$/,
  decimal: /^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/,
};

const RULE_MESSAGES = {
  letters: 'Only letters are allowed.',
  alpha_numeric: 'Only letters and numbers are allowed.',
  integer: 'Only whole numbers are allowed.',
  decimal: 'Only decimal and whole numbers are allowed.',
};

const SUPPORTED_INPUT_TYPES = new Set(['text_field', 'number_input']);

export function validateCustomRule({
  rule, value, label, type,
}) {
  if (!SUPPORTED_INPUT_TYPES.has(type) || !rule) {
    return '';
  }

  const pattern = RULE_PATTERNS[rule];
  if (!pattern) {
    return '';
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return '';
  }

  if (pattern.test(normalizedValue)) {
    return '';
  }

  const message = RULE_MESSAGES[rule] || 'Invalid field format.';

  return `${label}: ${message}`;
}
