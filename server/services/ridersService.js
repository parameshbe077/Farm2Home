import admin from 'firebase-admin';
import { getFirestore } from '../config/firebase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function envEmails(name) {
  return (process.env[name] || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function publicRider(id, data) {
  return {
    id,
    name: data.name || '',
    email: data.email || '',
    createdAt: data.createdAt || null,
    reusedAccount: Boolean(data.reusedAccount),
  };
}

export async function listRiders() {
  const snapshot = await getFirestore().collection('riders').get();
  return snapshot.docs
    .map((doc) => publicRider(doc.id, doc.data()))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function createRider({ name, email, password, createdBy }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (cleanName.length < 2 || cleanName.length > 40) {
    throw httpError(400, 'Enter the rider’s name (2–40 characters).');
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    throw httpError(400, 'Enter a valid email.');
  }
  if (envEmails('ADMIN_EMAILS').includes(cleanEmail)) {
    throw httpError(400, 'That email is an admin account. Use a different email for the rider.');
  }
  if (cleanPassword.length < 6 || cleanPassword.length > 64) {
    throw httpError(400, 'Password must be 6–64 characters.');
  }

  let existing = null;
  try {
    existing = await admin.auth().getUserByEmail(cleanEmail);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }

  if (existing) {
    return grantExistingAccount(existing, { cleanName, cleanEmail, cleanPassword, createdBy });
  }

  let user;
  try {
    user = await admin.auth().createUser({
      email: cleanEmail,
      password: cleanPassword,
      displayName: cleanName,
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const found = await admin.auth().getUserByEmail(cleanEmail);
      return grantExistingAccount(found, { cleanName, cleanEmail, cleanPassword, createdBy });
    }
    if (err.code === 'auth/invalid-password' || err.code === 'auth/invalid-email') {
      throw httpError(400, 'Check the email and use a password of at least 6 characters.');
    }
    throw err;
  }

  const createdAt = new Date().toISOString();
  try {
    await admin.auth().setCustomUserClaims(user.uid, { delivery: true });
    await getFirestore().collection('riders').doc(user.uid).set({
      name: cleanName,
      email: cleanEmail,
      active: true,
      reusedAccount: false,
      createdAt,
      createdBy: createdBy || '',
    });
  } catch (err) {
    await admin.auth().deleteUser(user.uid).catch(() => {});
    throw err;
  }

  return publicRider(user.uid, { name: cleanName, email: cleanEmail, createdAt, reusedAccount: false });
}

async function grantExistingAccount(user, { cleanName, cleanEmail, cleanPassword, createdBy }) {
  const doc = await getFirestore().collection('riders').doc(user.uid).get();
  if (doc.exists && doc.data()?.active !== false) {
    throw httpError(409, 'This email is already a rider.');
  }

  const previousClaims = { ...(user.customClaims || {}) };
  try {
    await admin.auth().updateUser(user.uid, {
      password: cleanPassword,
      displayName: cleanName,
      disabled: false,
    });
  } catch (err) {
    if (err.code === 'auth/invalid-password') {
      throw httpError(400, 'Password must be at least 6 characters.');
    }
    throw err;
  }

  const createdAt = new Date().toISOString();
  try {
    await admin.auth().setCustomUserClaims(user.uid, { ...previousClaims, delivery: true });
    await getFirestore().collection('riders').doc(user.uid).set({
      name: cleanName,
      email: cleanEmail,
      active: true,
      reusedAccount: true,
      createdAt,
      createdBy: createdBy || '',
    });
    await admin.auth().revokeRefreshTokens(user.uid);
  } catch (err) {
    await admin.auth().setCustomUserClaims(user.uid, previousClaims).catch(() => {});
    throw err;
  }

  return publicRider(user.uid, {
    name: cleanName,
    email: cleanEmail,
    createdAt,
    reusedAccount: true,
  });
}

export async function setRiderPassword(uid, password) {
  const cleanPassword = String(password || '');
  if (cleanPassword.length < 6 || cleanPassword.length > 64) {
    throw httpError(400, 'Password must be 6–64 characters.');
  }

  const doc = await getFirestore().collection('riders').doc(uid).get();
  if (!doc.exists) throw httpError(404, 'Rider not found.');

  try {
    await admin.auth().updateUser(uid, { password: cleanPassword });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      throw httpError(404, 'This rider login no longer exists.');
    }
    if (err.code === 'auth/invalid-password') {
      throw httpError(400, 'Password must be at least 6 characters.');
    }
    throw err;
  }
}

export async function deleteRider(uid) {
  const ref = getFirestore().collection('riders').doc(uid);
  const doc = await ref.get();
  if (!doc.exists) throw httpError(404, 'Rider not found.');

  try {
    const user = await admin.auth().getUser(uid);
    const claims = { ...(user.customClaims || {}) };
    delete claims.delivery;
    await admin.auth().setCustomUserClaims(uid, claims);
    await admin.auth().revokeRefreshTokens(uid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
  await ref.delete();
}

/** Env-listed riders, or a rider added in the admin panel (claim + Firestore record). */
export async function isActiveDeliveryUser(decoded) {
  if (!decoded?.email && !decoded?.uid) return false;
  const email = String(decoded.email || '').toLowerCase();
  if (email && envEmails('DELIVERY_EMAILS').includes(email)) return true;
  if (decoded.delivery !== true || !decoded.uid) return false;

  const doc = await getFirestore().collection('riders').doc(decoded.uid).get();
  return doc.exists && doc.data()?.active !== false;
}
