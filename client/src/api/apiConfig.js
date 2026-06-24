/** Local dev uses Vite proxy (/api → localhost:5000). Production uses VITE_API_URL. */
export function getApiRoot() {
  if (import.meta.env.DEV) return '';
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
