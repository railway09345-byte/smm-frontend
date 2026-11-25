/**
 * Safe local storage utility with JSON serialization and key prefixing.
 */

export const STORAGE_KEYS = {
  user: 'sacp_user',
  session: 'sacp_auth_session',
  membership: 'sacp_membership',
  contentItems: 'sacp_content_items',
  campaigns: 'sacp_campaigns',
  automationActive: 'sacp_automation_active',
  brandProfile: 'sacp_brand_profile',
  theme: 'sacp_theme',
  apiConfig: 'sacp_api_config'
};

export const storage = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item);
    } catch (e) {
      console.warn(`Storage get error for key "${key}":`, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage set error for key "${key}":`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Storage remove error for key "${key}":`, e);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }
};
