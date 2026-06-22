import { getFirestore, isFirebaseReady } from '../config/firebase.js';

const memoryProfiles = new Map();

function normalizeProfile(uid, data = {}) {
  return {
    uid,
    email: data.email || '',
    name: data.name || '',
    phone: data.phone || '',
    address: data.address || '',
    area: data.area || '',
    pincode: data.pincode || '',
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export async function getCustomerProfile(uid) {
  if (!isFirebaseReady()) {
    return memoryProfiles.get(uid) || normalizeProfile(uid);
  }

  const db = getFirestore();
  const doc = await db.collection('customers').doc(uid).get();
  if (!doc.exists) return normalizeProfile(uid);
  return normalizeProfile(uid, doc.data());
}

export async function upsertCustomerProfile(uid, data) {
  const existing = await getCustomerProfile(uid);
  const updated = normalizeProfile(uid, {
    ...existing,
    ...data,
    uid,
    updatedAt: new Date().toISOString(),
  });

  if (!isFirebaseReady()) {
    memoryProfiles.set(uid, updated);
    return updated;
  }

  const db = getFirestore();
  await db.collection('customers').doc(uid).set(updated, { merge: true });
  return updated;
}
