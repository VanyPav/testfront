/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Button, provider as UI } from '@dropins/tools/components.js';
import createAskQuestionForm from '../ask-form/ask-form.js';
import { createElement, createText } from '../helpers/dom.js';
import { isCustomerSignedIn } from '../faq-fetch.js';
import { CLASS_NAMES, TEXT } from './text.js';

function canAskQuestion(settings) {
  return settings?.allowGuestQuestions !== false || isCustomerSignedIn();
}

// The form is built on the first click and kept while hidden, so a draft survives.
export default function createAskSection(settings) {
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
