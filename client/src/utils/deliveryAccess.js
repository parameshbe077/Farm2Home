/** Optional extra riders from env. Riders added in the admin panel carry a delivery claim. */
export function getDeliveryEmails() {
  return (import.meta.env.VITE_DELIVERY_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isDeliveryEmail(email) {
  if (!email) return false;
  return getDeliveryEmails().includes(String(email).toLowerCase());
}

export async function isDeliveryStaff(user) {
  if (!user) return false;
  if (isDeliveryEmail(user.email)) return true;
  try {
    const result = await user.getIdTokenResult();
    return result.claims?.delivery === true;
  } catch {
    return false;
  }
}
