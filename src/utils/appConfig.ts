/**
 * Production & Application Configuration
 *
 * Centralized utility for resolving the application URL for OAuth redirects,
 * email verification, and self-referential endpoints.
 */

export const getAppUrl = (): string => {
  // 1. Check client-exposed Vite environment variable
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) {
      return String(import.meta.env.VITE_APP_URL).replace(/\/+$/, '');
    }
  } catch {}

  // 2. Check process.env in serverless/SSR contexts
  try {
    if (typeof process !== 'undefined' && process.env?.APP_URL) {
      return String(process.env.APP_URL).replace(/\/+$/, '');
    }
  } catch {}

  // 3. Fallback to browser window origin in browser environments
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};
