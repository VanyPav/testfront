/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

// The FAQ page asks for what it needs in as few documents as it can, so API Mesh resolves the
// fields in parallel instead of the page waiting on them one after another. Each field is aliased,
// and an error in one of them comes back with that alias in its `path`.
const FIELDS = {
  settings: {
    variables: [],
    selection: `settings: getAmFaqSettings {
      faqPageTitle
      urlPrefix
      allowGuestQuestions
    }`,
  },
  categories: {
    variables: [],
    selection: `categories: getAmFaqCategories {
      items {
        urlKey
        title
        position
      }
    }`,
  },
  questions: {
    variables: ['$page: Int'],
    selection: `questions: getAmFaqQuestions(page: $page) {
      items {
        urlKey
        title
        answer
        position
      }
      page
      pageSize
      total
    }`,
  },
  category: {
    variables: ['$urlKey: String', '$page: Int'],
    selection: `category: getAmFaqCategory(urlKey: $urlKey, page: $page) {
      found
      category {
        urlKey
        title
      }
      items {
        urlKey
        title
        answer
        position
      }
      page
      pageSize
      total
    }`,
  },
  question: {
    variables: ['$urlKey: String'],
    selection: `question: getAmFaqQuestion(urlKey: $urlKey) {
      found
      question {
        urlKey
        title
        answer
        categoryUrlKeys
      }
    }`,
  },
};

// GraphQL rejects a declared variable that no field uses, so the declarations follow the fields.
function buildFaqPageQuery(fieldNames, operationName) {
  const variables = [...new Set(fieldNames.flatMap((name) => FIELDS[name].variables))];
  const declaration = variables.length ? `(${variables.join(', ')})` : '';
  const selections = fieldNames.map((name) => FIELDS[name].selection).join('\n    ');

  return `
  query ${operationName}${declaration} {
    ${selections}
  }
`;
}

export { buildFaqPageQuery };
