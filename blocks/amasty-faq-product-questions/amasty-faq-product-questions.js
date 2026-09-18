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

// Verbatim from the original Magento module's own template, deliberately: the
// port keeps its wording, and like it, offers no link to sign in.
const GUEST_NOTICE = 'Please, mind that only logged in users can submit questions';

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

function renderGuestNotice(wrapper) {
  const notice = createElement('p', { className: 'amasty-faq-product-questions__guest-notice' });

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
      className: 'amasty-faq-product-questions__answer',
      dangerouslySetInnerHTML: { __html: item.answer || '' },
    }),
  ));
}

function renderHeading(wrapper, sectionTitle) {
  const heading = createElement('h2', { className: 'amasty-faq-product-questions__heading' });

  heading.textContent = sectionTitle || '';
  wrapper.append(heading);
}

function renderAccordion(wrapper, items) {
  const accordionContainer = createElement('div', { className: 'amasty-faq-product-questions__accordion' });

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

  // The section stays even with no questions: the form is the only way a first
  // question can ever appear, and a guest who cannot ask still gets told why.
  // The heading renders unconditionally too — without it, a lone form or a lone
  // notice gives the shopper no idea what section they are looking at.
  const wrapper = createElement('div', { className: 'amasty-faq-product-questions__wrapper' });

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
