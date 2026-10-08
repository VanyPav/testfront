/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { getRootPath } from '@dropins/tools/lib/aem/configs.js';
import { resolveFaqRoute } from './faq-fetch.js';

const DEFAULT_URL_PREFIX = 'faq';

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

  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Resolves what the FAQ page shows from the current address.
 * The page document is the same for every URL under the prefix (folder mapping),
 * so the pathname is the only source of truth.
 */
async function resolveRoute(settings, { pathname, search } = window.location) {
  const [prefix, urlKey, ...rest] = getPathSegments(pathname);

  if (prefix !== getUrlPrefix(settings) || rest.length > 0) {
    return { type: ROUTE_TYPES.notFound };
  }

  if (!urlKey) {
    return { type: ROUTE_TYPES.home, page: readPageNumber(search) };
  }

  const route = await resolveFaqRoute(urlKey);

  if (route?.type === ROUTE_TYPES.category) {
    return { type: ROUTE_TYPES.category, urlKey, page: readPageNumber(search) };
  }

  if (route?.type === ROUTE_TYPES.question) {
    return { type: ROUTE_TYPES.question, urlKey };
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
  resolveRoute,
};
