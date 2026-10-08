/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getRootPath } from '@dropins/tools/lib/aem/configs.js';

const DEFAULT_URL_PREFIX = 'faq';
// The API declares `page` as a GraphQL Int: a larger number fails the whole request, so it is
// capped here and ends up past the last page, which is "not found".
const MAX_PAGE = 2 ** 31 - 1;

const ROUTE_TYPES = {
  home: 'home',
  category: 'category',
  question: 'question',
  notFound: 'notFound',
};

function getUrlPrefix(settings) {
  return settings?.urlPrefix || DEFAULT_URL_PREFIX;
}

function getPathSegments(pathname) {
  const root = getRootPath();
  const relativePath = pathname.startsWith(root) ? pathname.slice(root.length) : pathname;

  return relativePath.split('/').filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

function readPageNumber(search) {
  const page = Number.parseInt(new URLSearchParams(search).get('page'), 10);

  return Number.isInteger(page) && page > 0 ? Math.min(page, MAX_PAGE) : 1;
}

/**
 * Splits the current address into what the FAQ page needs to ask the API for. The page document is
 * the same for every URL under the prefix (folder mapping), so the pathname is the only source of
 * truth. The prefix is only checked later, against the settings: on a first visit they arrive in
 * the same request as the content.
 */
function readFaqPath({ pathname, search } = window.location) {
  const [prefix, urlKey, ...rest] = getPathSegments(pathname);

  return {
    prefix,
    urlKey,
    page: readPageNumber(search),
    // Nested addresses are never FAQ pages: questions and categories share one flat namespace.
    isFlat: rest.length === 0,
  };
}

function isFaqPath(path, settings) {
  return path.isFlat && path.prefix === getUrlPrefix(settings);
}

// Which page fields the address needs, before anything is known about the URL key. A key can be a
// category or a question, so both are asked for at once instead of resolving the type first.
function getContentFields(path) {
  if (!path.isFlat) {
    return [];
  }

  return path.urlKey ? ['category', 'question'] : ['questions'];
}

function readField(data, name) {
  const value = data[name];

  if (value?.error) {
    throw value.error;
  }

  return value ?? null;
}

/**
 * Decides what the FAQ page shows from the address and the page data loaded for it. Throws the
 * field's error when the field that decides the page failed; a failure in a field the page turned
 * out not to need is ignored.
 */
function resolveRoute(path, settings, data) {
  if (!isFaqPath(path, settings)) {
    return { type: ROUTE_TYPES.notFound };
  }

  const { urlKey, page } = path;

  if (!urlKey) {
    return { type: ROUTE_TYPES.home, page, result: readField(data, 'questions') };
  }

  // Categories win over questions, as in `resolve-route`: saving refuses a URL key taken by
  // either, and should a duplicate slip through, the answer is the same on every request.
  const category = readField(data, 'category');

  if (category?.found) {
    return {
      type: ROUTE_TYPES.category, urlKey, page, result: category,
    };
  }

  const question = readField(data, 'question');

  if (question?.found) {
    return { type: ROUTE_TYPES.question, urlKey, result: question };
  }

  return { type: ROUTE_TYPES.notFound };
}

function buildHomeUrl(settings) {
  return `${getRootPath()}${getUrlPrefix(settings)}/`;
}

function buildEntityUrl(settings, urlKey) {
  return `${buildHomeUrl(settings)}${encodeURIComponent(urlKey)}`;
}

function withPage(url, page) {
  return page > 1 ? `${url}?page=${page}` : url;
}

function buildHomePageUrl(settings, page) {
  return withPage(buildHomeUrl(settings), page);
}

function buildCategoryPageUrl(settings, urlKey, page) {
  return withPage(buildEntityUrl(settings, urlKey), page);
}

export {
  ROUTE_TYPES,
  buildCategoryPageUrl,
  buildEntityUrl,
  buildHomePageUrl,
  buildHomeUrl,
  getContentFields,
  isFaqPath,
  readFaqPath,
  resolveRoute,
};
