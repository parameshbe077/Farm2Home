import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase/config';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_TIMEOUT_MS = 90_000;

export function validateProductImage(file) {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please use a JPG, PNG, or WebP image';
  }
  if (file.size > MAX_SIZE) {
    return 'Image must be under 5 MB';
  }
  return null;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function mapUploadError(err) {
  const code = err?.code || '';
  const message = err?.message || String(err);

  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    return 'Photo upload denied. Log out and log in again, then retry.';
  }
  if (code === 'storage/canceled') {
    return 'Photo upload was canceled.';
  }
  if (code === 'storage/quota-exceeded') {
    return 'Storage quota exceeded. Check your Firebase plan.';
  }
  if (message.includes('storage') || code.startsWith('storage/')) {
    return `Photo upload failed: ${message}. Enable Firebase Storage in the console.`;
  }
  if (message.includes('network') || message.includes('Failed to fetch')) {
    return 'Network error during upload. Check your internet and try again.';
  }
  return message || 'Photo upload failed';
}

export async function uploadProductImage(productId, file) {
  const validationError = validateProductImage(file);
  if (validationError) throw new Error(validationError);

  if (!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) {
    throw new Error('Firebase Storage is not configured in client/.env');
  }

  if (!auth.currentUser) {
    throw new Error('Session expired. Please log out and log in again before uploading photos.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext.replace('jpeg', 'jpg') : 'jpg';
  const path = `products/${productId}/${Date.now()}.${safeExt}`;
  const storageRef = ref(storage, path);

  const upload = async () => {
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  };

  try {
    return await withTimeout(
      upload(),
      UPLOAD_TIMEOUT_MS,
      'Photo upload timed out. Enable Firebase Storage (Build → Storage) and try a smaller image.'
    );
  } catch (err) {
    throw new Error(mapUploadError(err));
  }
}
