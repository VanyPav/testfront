/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { createElement, createLink, createText } from '../helpers/dom.js';
import { buildEntityUrl } from '../router.js';
import { CLASS_NAMES, TEXT } from './text.js';

export function readSidebarCategories(categories) {
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
export function markCurrentCategory(sidebar, urlKey) {
  const item = [...sidebar.querySelectorAll(`.${CLASS_NAMES.sidebarItem}`)]
    .find((element) => element.dataset.urlKey === urlKey);

  if (item) {
    item.classList.add(CLASS_NAMES.sidebarItemCurrent);
    item.textContent = item.textContent.trim();
  }
}

export function removeSidebar(wrapper, sidebarPlaceholder) {
  sidebarPlaceholder.remove();
  wrapper.classList.remove(CLASS_NAMES.wrapperWithSidebar);
}

// The column is reserved up front so the content does not shift; it goes only without categories.
export async function renderSidebar(wrapper, sidebarPlaceholder, settings, categoriesPromise) {
  const categories = await categoriesPromise;

  if (categories.length === 0) {
    removeSidebar(wrapper, sidebarPlaceholder);

    return null;
  }

  const sidebar = createSidebar(settings, categories);

  sidebarPlaceholder.replaceWith(sidebar);

  return sidebar;
}
