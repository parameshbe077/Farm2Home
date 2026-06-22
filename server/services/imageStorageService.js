import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import { isFirebaseReady } from '../config/firebase.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024;

async function withRetry(fn, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable = String(err.message || err).includes('Premature close')
        || String(err.message || err).includes('ECONNRESET')
        || String(err.message || err).includes('ETIMEDOUT');
      if (!retryable || i === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

export async function uploadProductImage(productId, file) {
  if (!isFirebaseReady()) {
    throw new Error('Firebase is not configured on the server');
  }
  if (!file?.buffer?.length) {
    throw new Error('No image file provided');
  }
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    throw new Error('Please use a JPG, PNG, or WebP image');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 5 MB');
  }

  const ext = file.mimetype === 'image/png'
    ? 'png'
    : file.mimetype === 'image/webp'
      ? 'webp'
      : 'jpg';
  const objectPath = `products/${productId}/${Date.now()}.${ext}`;
  const bucket = admin.storage().bucket();
  const token = randomUUID();

  try {
    await withRetry(() => bucket.file(objectPath).save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    }));
  } catch (err) {
    const message = String(err.message || err);
    if (message.includes('Premature close') || message.includes('oauth2')) {
      throw new Error(
        'Server could not reach Google Storage (network/auth). Use file upload in the browser or paste an image URL instead.'
      );
    }
    if (message.includes('bucket') || message.includes('not exist')) {
      throw new Error(
        'Firebase Storage is not set up. Enable Storage in Firebase Console (Build → Storage → Get started).'
      );
    }
    throw new Error(`Photo upload failed: ${message}`);
  }

  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}
