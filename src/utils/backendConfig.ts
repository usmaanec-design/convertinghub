/**
 * Centralized Backend API URL Resolver for ConvertingHub
 */

export const PRODUCTION_BACKEND_URL = 'https://convertinghub-backend.onrender.com';

/**
 * Returns absolute URL for backend endpoints to prevent relative /api 404s on static hostings & TWAs.
 */
export function getBackendUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const customUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_BRIDGE_URL || import.meta.env.VITE_BACKEND_URL
      : undefined;

  if (customUrl) {
    return `${customUrl.replace(/\/$/, '')}${cleanPath}`;
  }
  return `${PRODUCTION_BACKEND_URL}${cleanPath}`;
}
