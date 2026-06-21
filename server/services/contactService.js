import { getFirestore, isFirebaseReady } from '../config/firebase.js';

const memoryMessages = [];

export async function createContactMessage({ name, email, message }) {
  const entry = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseReady()) {
    const saved = { id: String(memoryMessages.length + 1), ...entry };
    memoryMessages.push(saved);
    return saved;
  }

  const db = getFirestore();
  const ref = await db.collection('contactMessages').add(entry);
  return { id: ref.id, ...entry };
}
