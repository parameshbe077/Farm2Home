import admin from 'firebase-admin';
import { isFirebaseReady } from '../config/firebase.js';
import { isActiveDeliveryUser } from '../services/ridersService.js';

function parseEmails(value) {
  return (value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getDeliveryEmails() {
  return [...new Set([
    ...parseEmails(process.env.DELIVERY_EMAILS),
    ...parseEmails(process.env.ADMIN_EMAILS),
  ])];
}

export async function requireDelivery(req, res, next) {
  if (!isFirebaseReady()) {
    return res.status(503).json({ error: 'Firebase is not configured' });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }

  try {
    const token = header.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email?.toLowerCase();
    const allowed = email && getDeliveryEmails().includes(email);
    const rider = allowed || await isActiveDeliveryUser(decoded);

    if (!rider) {
      return res.status(403).json({ error: 'Not a delivery account' });
    }

    req.delivery = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
