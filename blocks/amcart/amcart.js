/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Abandoned Cart Recovery
 */

import * as Cart from '@dropins/storefront-cart/api.js';
import { ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import {
  CUSTOMER_LOGIN_PATH,
  checkIsAuthenticated,
  rootLink,
} from '../../scripts/commerce.js';
import { verifyCartToken } from '../../scripts/amcart/amcart-fetch.js';
import renderAlertBanner from '../../scripts/amcart/ui-elements/alert-banner.js';

// Initialize
import '../../scripts/initializers/auth.js';
import '../../scripts/initializers/cart.js';

const TOKEN_REJECTION_MESSAGES = {
  expired: 'This recovery link has expired.',
  invalid_signature: 'This recovery link is not valid.',
  malformed: 'This recovery link is not valid.',
  cart_unavailable: 'This cart is no longer available.',
};

const CART_PATH = '/cart';
const GUEST_CART_COOKIE_EXPIRES_IN_DAYS = 30;

function restoreGuestCart(cartId) {
  // Same shape the cart drop-in itself uses for this cookie (no `Secure`/`SameSite` - matching it
  // keeps both writers consistent). Without `expires` the cookie only lived for the browser
  // session; `Secure` silently prevented it from being set at all on local http.
  const expires = new Date();
  expires.setDate(expires.getDate() + GUEST_CART_COOKIE_EXPIRES_IN_DAYS);

  document.cookie = `DROPIN__CART__CART-ID=${cartId}; expires=${expires.toUTCString()}; path=/`;
  sessionStorage.removeItem('DROPIN__CART__CART__DATA');
  sessionStorage.removeItem('DROPINS_CART_ID');
}

async function goToCart() {
  await Cart.refreshCart();

  window.location.href = rootLink(CART_PATH);
}

function buildSkippedItemsMessage(skippedItems) {
  return skippedItems.map((item) => item.sku).filter(Boolean).join(', ');
}

export default async function decorate(block) {
  const token = new URLSearchParams(window.location.search).get('token');

  const alertContainer = document.createElement('div');
  alertContainer.className = 'amcart__alert';

  const loaderContainer = document.createElement('div');
  loaderContainer.className = 'amcart__loader';

  block.textContent = '';
  block.append(alertContainer, loaderContainer);

  if (!token) {
    console.error('[amcart] Missing token in URL.');
    window.location.href = rootLink('/');

    return;
  }

  const spinner = await UI.render(ProgressSpinner, { ariaLabel: 'Restoring your cart' })(loaderContainer);

  let result;

  try {
    result = await verifyCartToken(token);
  } catch (error) {
    console.error('[amcart] Failed to verify cart token.', error);
    spinner.remove();
    renderAlertBanner(alertContainer, 'warning', 'Something went wrong. Please try again later.');

    return;
  }

  if (!result?.valid) {
    spinner.remove();
    const message = TOKEN_REJECTION_MESSAGES[result?.reason] || 'This recovery link is not valid.';
    renderAlertBanner(alertContainer, 'warning', message);

    return;
  }

  const {
    cartId, loginRequired, skippedItems = [],
  } = result;

  if (loginRequired && !checkIsAuthenticated()) {
    // Persistent customer cart, coupon already applied at send-time - nothing to restore here
    // (see acart's `verify-cart-token`), so a plain login redirect is enough; the cart drop-in
    // picks the customer's cart up on its own once they're signed in.
    window.location.href = rootLink(CUSTOMER_LOGIN_PATH);

    return;
  }

  if (!loginRequired) {
    // Guest: the backend already created the cart, put the items in it, and applied the coupon
    // (see acart's `verify-cart-token` action) - restoring here means only pointing the drop-in at
    // that cart, never re-creating or re-modifying it.
    restoreGuestCart(cartId);
  }

  try {
    if (skippedItems.length > 0) {
      spinner.remove();
      renderAlertBanner(
        alertContainer,
        'warning',
        'Some items could not be restored.',
        buildSkippedItemsMessage(skippedItems),
        { label: 'Continue to cart', onClick: goToCart },
      );

      return;
    }

    await goToCart();
  } catch (error) {
    console.error('[amcart] Failed to restore cart.', error);
    spinner.remove();
    renderAlertBanner(alertContainer, 'warning', 'Something went wrong. Please try again later.');
  }
}
