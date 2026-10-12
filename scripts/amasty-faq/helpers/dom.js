/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

function createElement(tagName, { className } = {}) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

function createText(tagName, text, className) {
  const element = createElement(tagName, { className });

  element.textContent = text;

  return element;
}

function createLink(href, text, className) {
  const link = createElement('a', { className });

  link.href = href;
  link.textContent = text;

  return link;
}

export {
  createElement,
  createLink,
  createText,
};
