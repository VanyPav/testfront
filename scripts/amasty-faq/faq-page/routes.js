/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { createText } from '../helpers/dom.js';
import {
  ROUTE_TYPES,
  buildCategoryPageUrl,
  buildHomePageUrl,
  resolveRoute,
} from '../router.js';
import createAskSection from './ask-section.js';
import {
  createAccordion,
  createAccordionColumns,
  createAnswer,
  createBackLink,
  createPagination,
  createTitle,
  setPageTitle,
} from './elements.js';
import { CLASS_NAMES, TEXT } from './text.js';

function readTotalPages(result) {
  return Math.max(1, Math.ceil((result.total ?? 0) / (result.pageSize || 1)));
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

export default function renderContent(view, settings, path, data) {
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
