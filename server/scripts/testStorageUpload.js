import 'dotenv/config';
import admin from 'firebase-admin';
import { initFirebase, isFirebaseReady } from '../config/firebase.js';

initFirebase();

if (!isFirebaseReady()) {
  console.error('Firebase not configured');
  process.exit(1);
}

const bucket = admin.storage().bucket();
console.log('Bucket:', bucket.name);

try {
  const [exists] = await bucket.exists();
  console.log('Bucket exists:', exists);

  await bucket.file('_test/upload-check.txt').save(Buffer.from('ok'), {
    metadata: { contentType: 'text/plain' },
  });
  console.log('Upload test: SUCCESS');
  await bucket.file('_test/upload-check.txt').delete();
  console.log('Cleanup: OK');
} catch (err) {
  console.error('Upload test FAILED:', err.message);
  process.exit(1);
}
