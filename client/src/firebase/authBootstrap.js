import { getRedirectResult } from 'firebase/auth';
import { auth } from './config';

/** Must run before React mounts so redirect credentials are not lost. */
export const googleRedirectResultPromise = getRedirectResult(auth);

export function isGoogleRedirectReturn() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('apiKey') && params.has('authType');
}
