import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function missingKeys() {
  return Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

const missing = missingKeys();
if (missing.length) {
  console.warn(
    `Firebase client config incomplete (missing: ${missing.join(', ')}). Copy client/.env.example to client/.env`
  );
}

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

export async function initAnalytics() {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getAnalytics(firebaseApp);
  } catch {
    return null;
  }
}
