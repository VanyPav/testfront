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

const GUEST_NOTICE = 'Please, mind that only logged in users can submit questions';

const CLASS_NAMES = {
  wrapper: 'amasty-faq-product-questions__wrapper',
  heading: 'amasty-faq-product-questions__heading',
  accordion: 'amasty-faq-product-questions__accordion',
  answer: 'amasty-faq-product-questions__answer',
  guestNotice: 'amasty-faq-product-questions__guest-notice',
};

function resolveSku() {
  return getSkuFromUrl() || events.lastPayload('pdp/data')?.sku;
}

function canAskQuestion(settings) {
  return settings?.allowGuestQuestions !== false || isCustomerSignedIn();
}

function renderGuestNotice(wrapper) {
  const notice = createElement('p', { className: CLASS_NAMES.guestNotice });

  notice.textContent = GUEST_NOTICE;
  wrapper.append(notice);
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
      className: CLASS_NAMES.answer,
      dangerouslySetInnerHTML: { __html: item.answer || '' },
    }),
  ));
}

function renderHeading(wrapper, sectionTitle) {
  const heading = createElement('h2', { className: CLASS_NAMES.heading });

  heading.textContent = sectionTitle || '';
  wrapper.append(heading);
}

function renderAccordion(wrapper, items) {
  const accordionContainer = createElement('div', { className: CLASS_NAMES.accordion });

  UI.render(Accordion, { children: buildAccordionSections(items) })(accordionContainer);

  wrapper.append(accordionContainer);
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

  const wrapper = createElement('div', { className: CLASS_NAMES.wrapper });

  renderHeading(wrapper, productQuestions?.sectionTitle);

  if (items.length > 0) {
    renderAccordion(wrapper, items);
  }

  if (showAskForm) {
    wrapper.append(createAskQuestionForm(sku));
  } else {
    renderGuestNotice(wrapper);
  }

  block.textContent = '';
  block.append(wrapper);
}
