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
  getCachedFaqCategories,
  getCachedFaqSettings,
  getFaqPageData,
  isCustomerSignedIn,
} from '../../scripts/amasty-faq/faq-fetch.js';
import {
  ROUTE_TYPES,
  buildCategoryPageUrl,
  buildEntityUrl,
  buildHomePageUrl,
  buildHomeUrl,
  getContentFields,
  isFaqPath,
  readFaqPath,
  resolveRoute,
} from '../../scripts/amasty-faq/router.js';

const TEXT = {
  backToFaq: 'Back to FAQ',
  noFaqQuestions: 'There are no questions yet.',
  noQuestions: 'There are no questions in this category yet.',
  openQuestion: 'Go to the question page',
  categoriesTitle: 'Categories:',
  askPrompt: 'Did you find what you were looking for?',
  askButton: 'Ask a question',
  hideAskForm: 'Hide form',
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
  accordion: 'amasty-faq__accordion',
  accordionColumns: 'amasty-faq__accordion-columns',
  answer: 'amasty-faq__answer',
  questionLink: 'amasty-faq__question-link',
  pagination: 'amasty-faq__pagination',
  paginationStatus: 'amasty-faq__pagination-status',
  message: 'amasty-faq__message',
  error: 'amasty-faq__error',
  ask: 'amasty-faq__ask',
  askPrompt: 'amasty-faq__ask-prompt',
  askPromptText: 'amasty-faq__ask-prompt-text',
  askFormContainer: 'amasty-faq__ask-form',
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

  // Sanitized on the server.
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

function createPagination({ page, totalPages, buildPageUrl }) {
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

function canAskQuestion(settings) {
  return settings?.allowGuestQuestions !== false || isCustomerSignedIn();
}

// The form is built on the first click and kept while hidden, so a draft survives.
function createAskSection(settings) {
  const section = createElement('div', { className: CLASS_NAMES.ask });

  if (!canAskQuestion(settings)) {
    section.append(createText('p', TEXT.guestNotice, CLASS_NAMES.message));

    return section;
  }

  const prompt = createElement('div', { className: CLASS_NAMES.askPrompt });
  const buttonContainer = createElement('div');
  // The form toggles its own `hidden` while its styles load, so the toggle lives on a container.
  const formContainer = createElement('div', { className: CLASS_NAMES.askFormContainer });
  let button;

  formContainer.hidden = true;

  const toggleForm = () => {
    if (!formContainer.hasChildNodes()) {
      formContainer.append(createAskQuestionForm());
    }

    formContainer.hidden = !formContainer.hidden;
    button?.setProps((prev) => ({
      ...prev,
      children: formContainer.hidden ? TEXT.askButton : TEXT.hideAskForm,
      'aria-expanded': !formContainer.hidden,
    }));
  };

  UI.render(Button, {
    type: 'button',
    variant: 'secondary',
    children: TEXT.askButton,
    'aria-expanded': false,
    onClick: toggleForm,
  })(buttonContainer).then((instance) => {
    button = instance;
  });

  prompt.append(createText('p', TEXT.askPrompt, CLASS_NAMES.askPromptText), buttonContainer);
  section.append(prompt, formContainer);

  return section;
}

function readTotalPages(result) {
  return Math.max(1, Math.ceil((result.total ?? 0) / (result.pageSize || 1)));
}

function createAccordion(settings, items) {
  const accordion = createElement('div', { className: CLASS_NAMES.accordion });

  UI.render(Accordion, { children: buildAccordionSections(settings, items) })(accordion);

  return accordion;
}

// First half on the left, so the stacked mobile layout keeps the server's order.
function createAccordionColumns(settings, items) {
  const columns = createElement('div', { className: CLASS_NAMES.accordionColumns });
  const half = Math.ceil(items.length / 2);

  columns.append(createAccordion(settings, items.slice(0, half)));

  if (items.length > half) {
    columns.append(createAccordion(settings, items.slice(half)));
  }

  return columns;
}

function renderNotFound(wrapper, settings) {
  setPageTitle(settings?.faqPageTitle);
  wrapper.append(
    createBackLink(settings),
    createTitle(TEXT.notFoundTitle),
    createText('p', TEXT.notFoundMessage, CLASS_NAMES.message),
  );
}

function renderCategory(wrapper, settings, { urlKey, page, result }) {
  const items = Array.isArray(result.items) ? result.items : [];
  const totalPages = readTotalPages(result);

  if (page > totalPages) {
    renderNotFound(wrapper, settings);

    return null;
  }

  setPageTitle(result.category?.title);
  wrapper.append(createBackLink(settings), createTitle(result.category?.title));

  if (items.length === 0) {
    wrapper.append(createText('p', TEXT.noQuestions, CLASS_NAMES.message));
  } else {
    wrapper.append(createAccordion(settings, items));
  }

  if (totalPages > 1) {
    wrapper.append(createPagination({
      page,
      totalPages,
      buildPageUrl: (pageNumber) => buildCategoryPageUrl(settings, urlKey, pageNumber),
    }));
  }

  wrapper.append(createAskSection(settings));

  return { currentCategoryUrlKey: urlKey };
}

function renderHome(wrapper, settings, { page, result }) {
  const items = Array.isArray(result?.items) ? result.items : [];
  const totalPages = readTotalPages(result ?? {});

  if (page > totalPages) {
    renderNotFound(wrapper, settings);

    return null;
  }

  setPageTitle(settings.faqPageTitle);
  wrapper.append(createTitle(settings.faqPageTitle));

  if (items.length === 0) {
    wrapper.append(createText('p', TEXT.noFaqQuestions, CLASS_NAMES.message));
  } else {
    wrapper.append(createAccordionColumns(settings, items));
  }

  if (totalPages > 1) {
    wrapper.append(createPagination({
      page,
      totalPages,
      buildPageUrl: (pageNumber) => buildHomePageUrl(settings, pageNumber),
    }));
  }

  wrapper.append(createAskSection(settings));

  return { currentCategoryUrlKey: null };
}

function renderQuestion(wrapper, settings, { result }) {
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

function readSidebarCategories(categories) {
  if (categories?.error) {
    console.error('[amasty-faq] Failed to load the categories sidebar.', categories.error);

    return [];
  }

  return Array.isArray(categories) ? categories : [];
}

function createSidebar(settings, categories) {
  const sidebar = createElement('aside', { className: CLASS_NAMES.sidebar });
  const list = createElement('ul', { className: CLASS_NAMES.sidebarList });

  categories.forEach((category) => {
    const item = createElement('li', { className: CLASS_NAMES.sidebarItem });

    item.dataset.urlKey = category.urlKey;
    item.append(createLink(buildEntityUrl(settings, category.urlKey), category.title));
    list.append(item);
  });

  sidebar.append(createText('h2', TEXT.categoriesTitle, CLASS_NAMES.sidebarTitle), list);

  return sidebar;
}

// Marked once the content reports the current category; the sidebar may render first.
function markCurrentCategory(sidebar, urlKey) {
  const item = [...sidebar.querySelectorAll(`.${CLASS_NAMES.sidebarItem}`)]
    .find((element) => element.dataset.urlKey === urlKey);

  if (item) {
    item.classList.add(CLASS_NAMES.sidebarItemCurrent);
    item.textContent = item.textContent.trim();
  }
}

function createSkeleton(lines) {
  const skeleton = createElement('div', { className: CLASS_NAMES.skeleton });

  UI.render(Skeleton, {
    rowGap: 'medium',
    children: [
      createVNode(SkeletonRow, { key: 'title', variant: 'heading', size: 'large' }),
      createVNode(SkeletonRow, {
        key: 'rows', size: 'medium', lines, fullWidth: true, multilineGap: 'medium',
      }),
    ],
  })(skeleton);

  return skeleton;
}

function renderContent(view, settings, path, data) {
  try {
    const route = resolveRoute(path, settings, data);

    return RENDERERS[route.type](view, settings, route);
  } catch (error) {
    console.error('[amasty-faq] Failed to load the FAQ content.', error);
    setPageTitle(settings.faqPageTitle);
    view.replaceChildren(
      createTitle(settings.faqPageTitle),
      createText('p', TEXT.loadError, CLASS_NAMES.error),
    );

    return null;
  }
}

function removeSidebar(wrapper, sidebarPlaceholder) {
  sidebarPlaceholder.remove();
  wrapper.classList.remove(CLASS_NAMES.wrapperWithSidebar);
}

// The column is reserved up front so the content does not shift; it goes only without categories.
async function renderSidebar(wrapper, sidebarPlaceholder, settings, categoriesPromise) {
  const categories = await categoriesPromise;

  if (categories.length === 0) {
    removeSidebar(wrapper, sidebarPlaceholder);

    return null;
  }

  const sidebar = createSidebar(settings, categories);

  sidebarPlaceholder.replaceWith(sidebar);

  return sidebar;
}

// Never rejects: a request that failed as a whole is a failure of every field it asked for.
async function loadPageData(fieldNames, path, operationName) {
  try {
    return await getFaqPageData(fieldNames, path, operationName);
  } catch (error) {
    return Object.fromEntries(fieldNames.map((name) => [name, { error }]));
  }
}

// The settings travel with the categories (both quick), so the sidebar never waits on the content.
async function renderPage(wrapper, content, sidebarPlaceholder) {
  // Rendered off-page and swapped in at once, so the skeleton stays until the content is ready.
  const view = createElement('div', { className: CLASS_NAMES.content });
  const path = readFaqPath();
  const cachedSettings = getCachedFaqSettings();
  const cachedCategories = getCachedFaqCategories();
  const sidebarDataPromise = loadPageData(
    [...(cachedSettings ? [] : ['settings']), ...(cachedCategories ? [] : ['categories'])],
    {},
    'GetAmFaqSidebar',
  );
  // With the settings known, an address outside the prefix needs no content at all. Without them,
  // the content is asked for anyway and the prefix is checked when the settings arrive.
  const contentDataPromise = loadPageData(
    !cachedSettings || isFaqPath(path, cachedSettings) ? getContentFields(path) : [],
    path,
  );
  const settings = cachedSettings ?? (await sidebarDataPromise).settings;

  if (!settings || settings.error) {
    // No prefix to build links with, so the sidebar goes too.
    console.error('[amasty-faq] Failed to load the FAQ settings.', settings?.error);
    removeSidebar(wrapper, sidebarPlaceholder);
    content.replaceChildren(createText('p', TEXT.loadError, CLASS_NAMES.error));

    return;
  }

  const categoriesPromise = cachedCategories
    ? Promise.resolve(cachedCategories)
    : sidebarDataPromise.then((data) => readSidebarCategories(data.categories));
  const sidebarPromise = renderSidebar(wrapper, sidebarPlaceholder, settings, categoriesPromise);
  const routeView = renderContent(view, settings, path, await contentDataPromise);

  content.replaceWith(view);

  const sidebar = await sidebarPromise;

  if (sidebar && routeView?.currentCategoryUrlKey) {
    markCurrentCategory(sidebar, routeView.currentCategoryUrlKey);
  }
}

export default function decorate(block) {
  const wrapper = createElement('div', { className: CLASS_NAMES.wrapper });
  const content = createElement('div', { className: CLASS_NAMES.content });
  const sidebarPlaceholder = createElement('aside', { className: CLASS_NAMES.sidebar });

  wrapper.classList.add(CLASS_NAMES.wrapperWithSidebar);
  content.append(createSkeleton(4));
  sidebarPlaceholder.append(createSkeleton(3));
  wrapper.append(content, sidebarPlaceholder);
  block.textContent = '';
  block.append(wrapper);

  // Not awaited on purpose: EDS loads the header and footer only after the first section's
  // blocks have finished decorating, so waiting for the FAQ API here keeps the page blank.
  renderPage(wrapper, content, sidebarPlaceholder);
}
