/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const TEXT = {
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

export const CLASS_NAMES = {
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
