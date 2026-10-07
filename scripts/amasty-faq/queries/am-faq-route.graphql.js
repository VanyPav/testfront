/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

export const RESOLVE_AM_FAQ_ROUTE_QUERY = `
  query ResolveAmFaqRoute($urlKey: String) {
    resolveAmFaqRoute(urlKey: $urlKey) {
      type
      urlKey
    }
  }
`;
