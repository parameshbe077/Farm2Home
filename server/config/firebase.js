import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;
let initialized = false;

function loadServiceAccount() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (jsonEnv) {
    return JSON.parse(jsonEnv);
  }

  const relativePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    'firebase-service-account.json';

  const accountPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(__dirname, '..', relativePath.replace(/^\.\//, ''));

  if (existsSync(accountPath)) {
    return JSON.parse(readFileSync(accountPath, 'utf8'));
  }

  return null;
}

export function initFirebase() {
  if (initialized) return db;

  initialized = true;
  const serviceAccount = loadServiceAccount();

  if (!serviceAccount) {
    console.warn(
      'Firebase not configured — using in-memory storage. See server/.env.example to connect Firestore.'
    );
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    console.log('Firebase Firestore connected');
    return db;
  } catch (err) {
    console.error('Firebase init failed:', err.message);
    return null;
  }
}

export function getFirestore() {
  return db;
}

export function isFirebaseReady() {
  return db !== null;
}
