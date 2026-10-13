/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { createElement, createText } from '../../scripts/amasty-faq/helpers/dom.js';
import {
  getCachedFaqCategories,
  getCachedFaqSettings,
  getFaqPageData,
} from '../../scripts/amasty-faq/faq-fetch.js';
import createSkeleton from '../../scripts/amasty-faq/helpers/skeleton.js';
import renderContent from '../../scripts/amasty-faq/faq-page/routes.js';
import {
  markCurrentCategory,
  readSidebarCategories,
  removeSidebar,
  renderSidebar,
} from '../../scripts/amasty-faq/faq-page/sidebar.js';
import { CLASS_NAMES, TEXT } from '../../scripts/amasty-faq/faq-page/text.js';
import { getContentFields, isFaqPath, readFaqPath } from '../../scripts/amasty-faq/router.js';

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
  content.append(createSkeleton(4, CLASS_NAMES.skeleton));
  sidebarPlaceholder.append(createSkeleton(3, CLASS_NAMES.skeleton));
  wrapper.append(content, sidebarPlaceholder);
  block.textContent = '';
  block.append(wrapper);

  // Not awaited on purpose: EDS loads the header and footer only after the first section's
  // blocks have finished decorating, so waiting for the FAQ API here keeps the page blank.
  renderPage(wrapper, content, sidebarPlaceholder);
}
