/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Accordion, AccordionSection, provider as UI } from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import { events } from '@dropins/tools/event-bus.js';
import { getSkuFromUrl } from '../../scripts/commerce.js';
import createAskQuestionForm from '../../scripts/amasty-faq/ask-form.js';
import { createElement } from '../../scripts/amasty-faq/dom.js';
import { getFaqPdpData, isCustomerSignedIn } from '../../scripts/amasty-faq/faq-fetch.js';

function resolveSku() {
  return getSkuFromUrl() || events.lastPayload('pdp/data')?.sku;
}

/**
 * The server decides this again on submit — hiding the form from a guest is a
 * courtesy, not the gate. When the settings did not arrive at all, show the
 * form: a guest then gets the action's own 403 instead of a missing feature.
 */
function canAskQuestion(settings) {
  return settings?.allowGuestQuestions !== false || isCustomerSignedIn();
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

function renderQuestions(wrapper, productQuestions, items) {
  const heading = createElement('h2', { className: 'amasty-faq-product-questions__heading' });
  const accordionContainer = createElement('div', { className: 'amasty-faq-product-questions__accordion' });

  heading.textContent = productQuestions.sectionTitle || '';

  UI.render(Accordion, { children: buildAccordionSections(items) })(accordionContainer);

  wrapper.append(heading, accordionContainer);
}

export default async function decorate(block) {
  const sku = resolveSku();

  if (!sku) {
    block.remove();

    return;
  }

  let data;

  try {
    data = await getFaqPdpData(sku);
  } catch (error) {
    console.error('[amasty-faq-product-questions] Failed to load product questions.', error);
    block.remove();

    return;
  }

  const { settings, productQuestions } = data;
  const items = Array.isArray(productQuestions?.items) ? productQuestions.items : [];
  const showAskForm = canAskQuestion(settings);

  // Nothing to read and nothing to ask with — the section has no reason to exist.
  if (items.length === 0 && !showAskForm) {
    block.remove();

    return;
  }

  const wrapper = createElement('div', { className: 'amasty-faq-product-questions__wrapper' });

  if (items.length > 0) {
    renderQuestions(wrapper, productQuestions, items);
  }

  if (showAskForm) {
    wrapper.append(createAskQuestionForm(sku));
  }

  block.textContent = '';
  block.append(wrapper);
}
