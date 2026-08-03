/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Abandoned Cart Recovery
 */

import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import * as Cart from '@dropins/storefront-cart/api.js';
import {
  CUSTOMER_FORGOTPASSWORD_PATH,
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
};

const CART_PATH = '/cart';

function restoreGuestCart(cartId) {
  document.cookie = `DROPIN__CART__CART-ID=${cartId}; path=/; SameSite=Lax; Secure`;
  sessionStorage.removeItem('DROPIN__CART__CART__DATA');
  sessionStorage.removeItem('DROPINS_CART_ID');
}

async function applyCouponAndRedirect(couponCode) {
  if (couponCode) {
    await Cart.applyCouponsToCart([couponCode], Cart.ApplyCouponsStrategy.REPLACE);
  }

  await Cart.refreshCart();

  window.location.href = rootLink(CART_PATH);
}

export default async function decorate(block) {
  const token = new URLSearchParams(window.location.search).get('token');

  const alertContainer = document.createElement('div');
  alertContainer.className = 'amcart__alert';

  const formContainer = document.createElement('div');
  formContainer.className = 'amcart__form';

  block.textContent = '';
  block.append(alertContainer, formContainer);

  if (!token) {
    console.error('[amcart] Missing token in URL.');
    window.location.href = rootLink('/');

    return;
  }

  let result;

  try {
    result = await verifyCartToken(token);
  } catch (error) {
    console.error('[amcart] Failed to verify cart token.', error);
    renderAlertBanner(alertContainer, 'warning', 'Something went wrong. Please try again later.');

    return;
  }

  if (!result?.valid) {
    const message = TOKEN_REJECTION_MESSAGES[result?.reason] || 'This recovery link is not valid.';
    renderAlertBanner(alertContainer, 'warning', message);

    return;
  }

  const { cartId, couponCode, loginRequired } = result;

  if (loginRequired && !checkIsAuthenticated()) {
    await authRenderer.render(SignIn, {
      routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
      routeRedirectOnSignIn: () => `${window.location.pathname}${window.location.search}`,
    })(formContainer);

    return;
  }

  if (!loginRequired) {
    restoreGuestCart(cartId);
  }

  try {
    await applyCouponAndRedirect(couponCode);
  } catch (error) {
    console.error('[amcart] Failed to restore cart.', error);
    renderAlertBanner(alertContainer, 'warning', 'Something went wrong. Please try again later.');
  }
}
