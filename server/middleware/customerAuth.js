import admin from 'firebase-admin';
import { isFirebaseReady } from '../config/firebase.js';

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireCustomer(req, res, next) {
  if (!isFirebaseReady()) {
    req.user = { uid: 'local-dev-user', email: 'dev@local.test' };
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to continue' });
  }

  try {
    const token = header.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    const adminEmails = getAdminEmails();

    if (adminEmails.includes(decoded.email?.toLowerCase())) {
      return res.status(403).json({
        error: 'This is an admin account. Use a separate customer account to shop.',
      });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
