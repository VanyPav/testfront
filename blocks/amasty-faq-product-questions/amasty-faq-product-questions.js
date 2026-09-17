/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Accordion, AccordionSection, provider as UI } from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import { events } from '@dropins/tools/event-bus.js';
import { getSkuFromUrl } from '../../scripts/commerce.js';
import { getFaqProductQuestions } from '../../scripts/amasty-faq/faq-fetch.js';

function createElement(tagName, { className } = {}) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

function resolveSku() {
  return getSkuFromUrl() || events.lastPayload('pdp/data')?.sku;
}

function buildAccordionSections(items) {
  return items.map((item) => createVNode(
    AccordionSection,
    {
      key: item.urlKey || item.title,
      title: item.title,
      ariaLabelTitle: item.title,
    },
    createVNode('div', {
      className: 'amasty-faq-product-questions__answer',
      dangerouslySetInnerHTML: { __html: item.answer || '' },
    }),
  ));
}

export default async function decorate(block) {
  const sku = resolveSku();

  if (!sku) {
    block.remove();

    return;
  }

  let data;

  try {
    data = await getFaqProductQuestions(sku);
  } catch (error) {
    console.error('[amasty-faq-product-questions] Failed to load product questions.', error);
    block.remove();

    return;
  }

  const items = Array.isArray(data?.items) ? data.items : [];

  if (items.length === 0) {
    block.remove();

    return;
  }

  const wrapper = createElement('div', { className: 'amasty-faq-product-questions__wrapper' });
  const heading = createElement('h2', { className: 'amasty-faq-product-questions__heading' });
  const accordionContainer = createElement('div', { className: 'amasty-faq-product-questions__accordion' });

  heading.textContent = data.sectionTitle || '';

  UI.render(Accordion, { children: buildAccordionSections(items) })(accordionContainer);

  wrapper.append(heading, accordionContainer);
  block.textContent = '';
  block.append(wrapper);
}
