/**
 * WhatsApp Configuration Module
 * Shared utilities and configuration fetching for WhatsApp integration
 */

import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';

/**
 * Gets the WhatsApp GraphQL endpoint from configuration
 * Falls back to window variable or default if not configured
 * @returns {string} The GraphQL endpoint URL
 */
function getWhatsAppGraphQLEndpoint() {
  // Priority: config.json > window variable > default
  return getConfigValue('whatsapp.graphql-endpoint');
}

const WHATSAPP_CONFIG_QUERY = `
  query GetWhatsAppConfig {
    storeConfig {
      whatsapp_phone
      whatsapp_message
      whatsapp_enabled
      whatsapp_icon_position
      whatsapp_use_custom_icon
      whatsapp_custom_icon_url
    }
  }
`;

// Cache for configuration to avoid repeated API calls
let whatsappConfigCache = null;

// Default fallback values
export const DEFAULT_CONFIG = {
  phone: '+541234567890',
  message: 'Hi! I have a question.',
  enabled: false,
  iconPosition: 'whatsapp-bottom-right',
  useCustomIcon: false,
  customIconUrl: '',
};

/**
 * Cleans phone number for WhatsApp format
 * Removes spaces, dashes, and the + prefix
 * @param {string} phone - Raw phone number
 * @returns {string} Cleaned phone number
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone
    .replace(/\s+/g, '') // Remove spaces
    .replace(/-/g, '') // Remove dashes
    .replace(/^\+/, ''); // Remove + prefix
}

/**
 * Validates if phone number is valid (not default placeholder)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid
 */
export function isValidPhone(phone) {
  return phone && phone !== DEFAULT_CONFIG.phone && phone.length > 5;
}

/**
 * Checks if WhatsApp should be hidden on current page
 * @returns {boolean} True if should be hidden
 */
export function shouldHideOnThisPage() {
  const path = window.location.pathname;
  const hiddenPaths = ['/checkout', '/cart'];
  return hiddenPaths.some((hiddenPath) => path.startsWith(hiddenPath));
}

/**
 * Normalizes icon position value to valid CSS class
 * @param {string} position - Position value from config
 * @returns {string} Valid CSS class name for position
 */
export function normalizeIconPosition(position) {
  const validPositions = [
    'whatsapp-bottom-right',
    'whatsapp-bottom-left',
    'whatsapp-top-right',
    'whatsapp-top-left',
  ];

  // If position is valid, return it
  if (validPositions.includes(position)) {
    return position;
  }

  // Default to bottom-right if invalid
  return 'whatsapp-bottom-right';
}

/**
 * Fetches WhatsApp configuration from GraphQL endpoint
 * @returns {Promise<{phone: string, message: string, enabled: boolean,
 * iconPosition: string, useCustomIcon: boolean, customIconUrl: string}|null>}
 */
export async function fetchWhatsAppConfig() {
  // Return cached config if available
  if (whatsappConfigCache) {
    return whatsappConfigCache;
  }

  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: WHATSAPP_CONFIG_QUERY,
      }),
      credentials: 'omit',
    };

    const endpoint = getWhatsAppGraphQLEndpoint();

    const response = await fetch(endpoint, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors) {
      return null;
    }

    // Extract storeConfig from response
    const { storeConfig } = result.data || {};
    if (!storeConfig) {
      return null;
    }

    // Process and cache configuration
    const iconPos = storeConfig.whatsapp_icon_position || DEFAULT_CONFIG.iconPosition;
    whatsappConfigCache = {
      phone: cleanPhoneNumber(storeConfig.whatsapp_phone),
      message: storeConfig.whatsapp_message || '',
      enabled: storeConfig.whatsapp_enabled !== false,
      iconPosition: normalizeIconPosition(iconPos),
      useCustomIcon: storeConfig.whatsapp_use_custom_icon === true,
      customIconUrl: storeConfig.whatsapp_custom_icon_url || '',
    };

    return whatsappConfigCache;
  } catch (error) {
    return null;
  }
}

/**
 * Clears the cached configuration (useful for testing or forced refresh)
 */
export function clearWhatsAppConfigCache() {
  whatsappConfigCache = null;
}
