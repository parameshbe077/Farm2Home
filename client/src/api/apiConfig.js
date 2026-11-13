/**
 * Vite dev uses the /api proxy. `npm start` serves the built app on localhost,
 * so those pages call the local API. Hosted builds use VITE_API_URL.
 */
export function getApiRoot() {
  if (import.meta.env.DEV) return '';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '';
  }
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

export function getApiBase() {
  const root = getApiRoot();
  return root ? `${root}/api` : '/api';
}

export function getAdminApiBase() {
  const root = getApiRoot();
  return root ? `${root}/api/admin` : '/api/admin';
}
