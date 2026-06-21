import admin from 'firebase-admin';
import { isFirebaseReady } from '../config/firebase.js';

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req, res, next) {
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
    const allowed = getAdminEmails();

    if (allowed.length && !allowed.includes(decoded.email?.toLowerCase())) {
      return res.status(403).json({ error: 'Not an admin account' });
    }

    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
