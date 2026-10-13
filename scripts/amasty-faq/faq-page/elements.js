/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Accordion, AccordionSection, provider as UI } from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import { createElement, createLink, createText } from '../helpers/dom.js';
import { buildEntityUrl, buildHomeUrl } from '../router.js';
import { CLASS_NAMES, TEXT } from './text.js';

export function setPageTitle(title) {
  if (title) {
    document.title = title;
  }
}

export function createTitle(text) {
  return createText('h1', text || '', CLASS_NAMES.title);
}

export function createAnswer(html) {
  const answer = createElement('div', { className: CLASS_NAMES.answer });

  // Sanitized on the server.
  answer.innerHTML = html || '';

  return answer;
}

export function createBackLink(settings) {
  return createLink(buildHomeUrl(settings), TEXT.backToFaq, CLASS_NAMES.back);
}

export function createPagination({ page, totalPages, buildPageUrl }) {
  const nav = createElement('nav', { className: CLASS_NAMES.pagination });

  nav.setAttribute('aria-label', 'Pagination');

  if (page > 1) {
    nav.append(createLink(buildPageUrl(page - 1), TEXT.previousPage));
  }

  nav.append(createText('span', TEXT.pageOf(page, totalPages), CLASS_NAMES.paginationStatus));

  if (page < totalPages) {
    nav.append(createLink(buildPageUrl(page + 1), TEXT.nextPage));
  }

  return nav;
}

function buildAccordionSections(settings, items) {
  return items.map((item) => createVNode(
    AccordionSection,
    {
      key: item.urlKey || item.title,
      title: item.title,
      ariaLabelTitle: item.title,
    },
    createVNode(
      'div',
      null,
      createVNode('div', {
        className: CLASS_NAMES.answer,
        dangerouslySetInnerHTML: { __html: item.answer || '' },
      }),
      createVNode('a', {
        className: CLASS_NAMES.questionLink,
        href: buildEntityUrl(settings, item.urlKey),
      }, TEXT.openQuestion),
    ),
  ));
}

export function createAccordion(settings, items) {
  const accordion = createElement('div', { className: CLASS_NAMES.accordion });

  UI.render(Accordion, { children: buildAccordionSections(settings, items) })(accordion);

  return accordion;
}

// First half on the left, so the stacked mobile layout keeps the server's order.
export function createAccordionColumns(settings, items) {
  const columns = createElement('div', { className: CLASS_NAMES.accordionColumns });
  const half = Math.ceil(items.length / 2);

  columns.append(createAccordion(settings, items.slice(0, half)));

  if (items.length > half) {
    columns.append(createAccordion(settings, items.slice(half)));
  }

  return columns;
}
