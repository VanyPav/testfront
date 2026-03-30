import { loadCSS } from '../aem.js';
import { initializeDropin } from './index.js';
import {
  fetchWhatsAppConfig,
  shouldHideOnThisPage,
  isValidPhone,
  normalizeIconPosition,
  DEFAULT_CONFIG,
} from '../whatsapp-config.js';

/**
 * Creates WhatsApp button element
 * @param {string} phone - Phone number
 * @param {string} message - Default message
 * @param {boolean} useCustomIcon - Whether to use custom icon
 * @param {string} customIconUrl - URL of custom icon
 * @param {string} iconPosition - Position class (whatsapp-bottom-right, etc.)
 * @returns {HTMLElement} Button element
 */
function createWhatsAppButton(phone, message, useCustomIcon = false, customIconUrl = '', iconPosition = DEFAULT_CONFIG.iconPosition) {
  const button = document.createElement('a');
  const positionClass = normalizeIconPosition(iconPosition);
  button.className = `whatsapp-fab ${positionClass}`;
  button.href = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.setAttribute('aria-label', 'Chatear por WhatsApp');

  const img = document.createElement('img');
  // Use custom icon if configured, otherwise use default
  img.src = useCustomIcon && customIconUrl ? customIconUrl : '/icons/whatsapp-contact.svg';
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  button.append(img);

  return button;
}

/**
 * Initializes WhatsApp button on the page
 */
async function initWhatsApp() {
  // Check if button already exists
  if (document.querySelector('.whatsapp-fab')) {
    return;
  }

  // Check if should be hidden on this page
  if (shouldHideOnThisPage()) {
    return;
  }

  // Load CSS
  loadCSS('/blocks/whatsapp-contact/whatsapp-contact.css');

  // Fetch configuration
  const config = await fetchWhatsAppConfig();

  // Use config or fallback values
  const phone = config?.phone || DEFAULT_CONFIG.phone;
  const message = config?.message || DEFAULT_CONFIG.message;
  const useCustomIcon = config?.useCustomIcon || DEFAULT_CONFIG.useCustomIcon;
  const customIconUrl = config?.customIconUrl || DEFAULT_CONFIG.customIconUrl;
  const iconPosition = config?.iconPosition || DEFAULT_CONFIG.iconPosition;

  // Check if disabled via config
  if (config && config.enabled === false) {
    return;
  }

  // Validate phone number
  if (!isValidPhone(phone)) {
    return;
  }

  // Create and append button with position class
  const button = createWhatsAppButton(phone, message, useCustomIcon, customIconUrl, iconPosition);
  document.body.append(button);
}

// Initialize WhatsApp using the dropin pattern
await initializeDropin(async () => {
  await initWhatsApp();
})();
