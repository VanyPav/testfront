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

export {
  createElement,
};
