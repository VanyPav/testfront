/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import {
  Accordion,
  AccordionSection,
  Button,
  Skeleton,
  SkeletonRow,
  provider as UI,
} from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import createAskQuestionForm from '../../scripts/amasty-faq/ask-form.js';
import { createElement } from '../../scripts/amasty-faq/dom.js';
import {
  getFaqCategories,
  getFaqCategory,
  getFaqQuestion,
  getFaqSettings,
  isCustomerSignedIn,
} from '../../scripts/amasty-faq/faq-fetch.js';
import {
  ROUTE_TYPES,
  buildCategoryPageUrl,
  buildEntityUrl,
  buildHomeUrl,
  resolveRoute,
} from '../../scripts/amasty-faq/router.js';

const TEXT = {
  backToFaq: 'Back to FAQ',
  noCategories: 'There are no questions yet.',
  noQuestions: 'There are no questions in this category yet.',
  openQuestion: 'Go to the question page',
  categoriesTitle: 'Categories:',
  askPrompt: 'Did you find what you were looking for?',
  askButton: 'Ask a question',
  guestNotice: 'Please, mind that only logged in users can submit questions',
  notFoundTitle: 'Page not found',
  notFoundMessage: 'The question or category you are looking for does not exist or is no longer available.',
  loadError: 'We could not load the FAQ. Please try again later.',
  previousPage: 'Previous',
  nextPage: 'Next',
  pageOf: (page, totalPages) => `Page ${page} of ${totalPages}`,
};

const CLASS_NAMES = {
  wrapper: 'amasty-faq__wrapper',
  wrapperWithSidebar: 'amasty-faq__wrapper--with-sidebar',
  sidebar: 'amasty-faq__sidebar',
  sidebarTitle: 'amasty-faq__sidebar-title',
  sidebarList: 'amasty-faq__sidebar-list',
  sidebarItem: 'amasty-faq__sidebar-item',
  sidebarItemCurrent: 'amasty-faq__sidebar-item--current',
  content: 'amasty-faq__content',
  skeleton: 'amasty-faq__skeleton',
  back: 'amasty-faq__back',
  title: 'amasty-faq__title',
  categories: 'amasty-faq__categories',
  categoryLink: 'amasty-faq__category-link',
  accordion: 'amasty-faq__accordion',
  answer: 'amasty-faq__answer',
  questionLink: 'amasty-faq__question-link',
  pagination: 'amasty-faq__pagination',
  paginationStatus: 'amasty-faq__pagination-status',
  message: 'amasty-faq__message',
  error: 'amasty-faq__error',
  ask: 'amasty-faq__ask',
  askPrompt: 'amasty-faq__ask-prompt',
  askPromptText: 'amasty-faq__ask-prompt-text',
};

function createLink(href, text, className) {
  const link = createElement('a', { className });

  link.href = href;
  link.textContent = text;

  return link;
}

function createText(tagName, text, className) {
  const element = createElement(tagName, { className });

  element.textContent = text;

  return element;
}

function createTitle(text) {
  return createText('h1', text || '', CLASS_NAMES.title);
}

function createAnswer(html) {
  const answer = createElement('div', { className: CLASS_NAMES.answer });

  // The answer is server-sanitized HTML (see STOREFRONT_HANDOFF.md §2), rendered as is.
  answer.innerHTML = html || '';

  return answer;
}

function createBackLink(settings) {
  return createLink(buildHomeUrl(settings), TEXT.backToFaq, CLASS_NAMES.back);
}

function setPageTitle(title) {
  if (title) {
    document.title = title;
  }
}

async function renderHome(wrapper, settings) {
  const categories = await getFaqCategories();

  setPageTitle(settings.faqPageTitle);
  wrapper.append(createTitle(settings.faqPageTitle));

  if (categories.length === 0) {
    wrapper.append(createText('p', TEXT.noCategories, CLASS_NAMES.message));

    return;
  }

  const list = createElement('ul', { className: CLASS_NAMES.categories });

  categories.forEach((category) => {
    const item = createElement('li');

    item.append(createLink(
      buildEntityUrl(settings, category.urlKey),
      category.title,
      CLASS_NAMES.categoryLink,
    ));
    list.append(item);
  });

  wrapper.append(list);
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

function createPagination(settings, { urlKey, page, totalPages }) {
  const nav = createElement('nav', { className: CLASS_NAMES.pagination });

  nav.setAttribute('aria-label', 'Pagination');

  if (page > 1) {
    nav.append(createLink(
      buildCategoryPageUrl(settings, urlKey, page - 1),
      TEXT.previousPage,
    ));
  }

  nav.append(createText('span', TEXT.pageOf(page, totalPages), CLASS_NAMES.paginationStatus));

  if (page < totalPages) {
    nav.append(createLink(buildCategoryPageUrl(settings, urlKey, page + 1), TEXT.nextPage));
  }

  return nav;
}

function canAskQuestion(settings) {
  return settings?.allowGuestQuestions !== false || isCustomerSignedIn();
}

// As in the original module: a prompt with a button under the questions, which reveals the form.
function createAskSection(settings) {
  const section = createElement('div', { className: CLASS_NAMES.ask });

  if (!canAskQuestion(settings)) {
    section.append(createText('p', TEXT.guestNotice, CLASS_NAMES.message));

    return section;
  }

  const prompt = createElement('div', { className: CLASS_NAMES.askPrompt });
  const buttonContainer = createElement('div');

  UI.render(Button, {
    type: 'button',
    variant: 'secondary',
    children: TEXT.askButton,
    onClick: () => prompt.replaceWith(createAskQuestionForm()),
  })(buttonContainer);

  prompt.append(createText('p', TEXT.askPrompt, CLASS_NAMES.askPromptText), buttonContainer);
  section.append(prompt);

  return section;
}

function renderNotFound(wrapper, settings) {
  setPageTitle(settings?.faqPageTitle);
  wrapper.append(
    createBackLink(settings),
    createTitle(TEXT.notFoundTitle),
    createText('p', TEXT.notFoundMessage, CLASS_NAMES.message),
  );
}

async function renderCategory(wrapper, settings, { urlKey, page }) {
  const result = await getFaqCategory(urlKey, page);

  if (!result?.found) {
    renderNotFound(wrapper, settings);

    return null;
  }

  const items = Array.isArray(result.items) ? result.items : [];
  const totalPages = Math.max(1, Math.ceil((result.total ?? 0) / (result.pageSize || 1)));

  if (page > totalPages) {
    renderNotFound(wrapper, settings);

    return null;
  }

  setPageTitle(result.category?.title);
  wrapper.append(createBackLink(settings), createTitle(result.category?.title));

  if (items.length === 0) {
    wrapper.append(createText('p', TEXT.noQuestions, CLASS_NAMES.message));
  } else {
    const accordion = createElement('div', { className: CLASS_NAMES.accordion });

    UI.render(Accordion, { children: buildAccordionSections(settings, items) })(accordion);
    wrapper.append(accordion);
  }

  if (totalPages > 1) {
    wrapper.append(createPagination(settings, { urlKey, page, totalPages }));
  }

  wrapper.append(createAskSection(settings));

  return { currentCategoryUrlKey: urlKey };
}

async function renderQuestion(wrapper, settings, { urlKey }) {
  const result = await getFaqQuestion(urlKey);

  if (!result?.found) {
    renderNotFound(wrapper, settings);

    return null;
  }

  setPageTitle(result.question?.title);
  wrapper.append(
    createBackLink(settings),
    createTitle(result.question?.title),
    createAnswer(result.question?.answer),
  );

  return { currentCategoryUrlKey: result.question?.categoryUrlKeys?.[0] };
}

const RENDERERS = {
  [ROUTE_TYPES.home]: renderHome,
  [ROUTE_TYPES.category]: renderCategory,
  [ROUTE_TYPES.question]: renderQuestion,
  [ROUTE_TYPES.notFound]: renderNotFound,
};

const ROUTES_WITH_SIDEBAR = [ROUTE_TYPES.category, ROUTE_TYPES.question];

function loadSidebarCategories() {
  // The sidebar is secondary: without it the page still shows its own content.
  return getFaqCategories().catch((error) => {
    console.error('[amasty-faq] Failed to load the categories sidebar.', error);

    return [];
  });
}

function createSidebar(settings, categories, currentCategoryUrlKey) {
  const sidebar = createElement('aside', { className: CLASS_NAMES.sidebar });
  const list = createElement('ul', { className: CLASS_NAMES.sidebarList });

  categories.forEach((category) => {
    const item = createElement('li', { className: CLASS_NAMES.sidebarItem });

    if (category.urlKey === currentCategoryUrlKey) {
      item.classList.add(CLASS_NAMES.sidebarItemCurrent);
      item.textContent = category.title;
    } else {
      item.append(createLink(buildEntityUrl(settings, category.urlKey), category.title));
    }

    list.append(item);
  });

  sidebar.append(createText('h2', TEXT.categoriesTitle, CLASS_NAMES.sidebarTitle), list);

  return sidebar;
}

function createSkeleton() {
  const skeleton = createElement('div', { className: CLASS_NAMES.skeleton });

  UI.render(Skeleton, {
    rowGap: 'medium',
    children: [
      createVNode(SkeletonRow, { key: 'title', variant: 'heading', size: 'large' }),
      createVNode(SkeletonRow, {
        key: 'rows', size: 'medium', lines: 4, fullWidth: true, multilineGap: 'medium',
      }),
    ],
  })(skeleton);

  return skeleton;
}

async function renderPage(wrapper, content) {
  // Rendered off-page and swapped in at once, so the skeleton stays until everything is ready.
  const view = createElement('div', { className: CLASS_NAMES.content });

  try {
    const settings = await getFaqSettings();
    const route = await resolveRoute(settings);
    const categoriesPromise = ROUTES_WITH_SIDEBAR.includes(route.type)
      ? loadSidebarCategories()
      : Promise.resolve([]);
    const [routeView, categories] = await Promise.all([
      RENDERERS[route.type](view, settings, route),
      categoriesPromise,
    ]);

    content.replaceWith(view);

    // A missing category or question renders "not found", which has no sidebar.
    if (routeView && categories.length > 0) {
      wrapper.classList.add(CLASS_NAMES.wrapperWithSidebar);
      wrapper.append(createSidebar(settings, categories, routeView.currentCategoryUrlKey));
    }
  } catch (error) {
    // The page has nothing else on it, so a failure is shown instead of removing the block.
    console.error('[amasty-faq] Failed to load the FAQ page.', error);
    content.replaceChildren(createText('p', TEXT.loadError, CLASS_NAMES.error));
  }
}

export default function decorate(block) {
  const wrapper = createElement('div', { className: CLASS_NAMES.wrapper });
  const content = createElement('div', { className: CLASS_NAMES.content });

  content.append(createSkeleton());
  wrapper.append(content);
  block.textContent = '';
  block.append(wrapper);

  // Not awaited on purpose: EDS loads the header and footer only after the first section's
  // blocks have finished decorating, so waiting for the FAQ API here keeps the page blank.
  renderPage(wrapper, content);
}
