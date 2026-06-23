/** Empty in local dev (Vite proxies /api). Set on Vercel: https://your-api.onrender.com */
export function getApiRoot() {
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
