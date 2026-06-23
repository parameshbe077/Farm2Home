/** Must match server ADMIN_EMAILS (comma-separated). Used to split store vs admin sessions. */
export function getAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const allowed = getAdminEmails();
  if (!allowed.length) return false;
  return allowed.includes(String(email).toLowerCase());
}
