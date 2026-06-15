/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

function getFieldName(input) {
  return `am_custom_field_${input?.id ?? 'unknown'}`;
}

function getFieldLabel(input) {
  return input?.settings?.label || `Field ${input?.id ?? ''}`.trim();
}

function getMaxLength(settings) {
  const parsed = Number.parseInt(settings?.maxLength, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isFieldRequired(input) {
  return !!input?.settings?.isRequired;
}

function normalizeControlValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function hasNonEmptyValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return normalizeControlValue(value).trim().length > 0;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option, index) => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: option,
        id: `option_${index}`,
      };
    }

    const optionValue = option?.value ?? option?.id ?? option?.label ?? option?.name ?? `${index}`;
    const optionLabel = option?.label ?? option?.name ?? option?.value ?? option?.id ?? `Option ${index + 1}`;

    return {
      value: normalizeControlValue(optionValue),
      label: normalizeControlValue(optionLabel),
      id: option?.id ?? `option_${index}`,
    };
  });
}

function createElement(tagName, { className, noValidate, hidden } = {}) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (typeof noValidate === 'boolean') {
    element.noValidate = noValidate;
  }

  if (typeof hidden === 'boolean') {
    element.hidden = hidden;
  }

  return element;
}

function createFormLayoutNodes() {
  const wrapper = createElement('div', {
    className: 'amasty-custom-form-builder__form',
  });
  const heading = createElement('div', {
    className: 'amasty-custom-form-builder__heading',
  });
  const formElement = createElement('form', {
    className: 'amasty-custom-form-builder__form-element',
    noValidate: true,
  });
  const alertContainer = createElement('div', {
    className: 'amasty-custom-form-builder__alert',
  });
  const fieldsContainer = createElement('div', {
    className: 'amasty-custom-form-builder__fields',
  });

  return {
    wrapper,
    heading,
    formElement,
    alertContainer,
    fieldsContainer,
  };
}

export {
  getFieldName,
  getFieldLabel,
  getMaxLength,
  isFieldRequired,
  normalizeControlValue,
  hasNonEmptyValue,
  normalizeOptions,
  createElement,
  createFormLayoutNodes,
};
