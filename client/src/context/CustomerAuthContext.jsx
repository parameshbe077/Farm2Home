import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { auth, authReady } from '../firebase/config';
import { googleRedirectResultPromise, isGoogleRedirectReturn } from '../firebase/authBootstrap';
import { isAdminEmail } from '../utils/adminAccess';

const CustomerAuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function shouldUseGoogleRedirect() {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

function isPopupCancelled(err) {
  const code = err?.code || '';
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request';
}

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAuthError, setGoogleAuthError] = useState(null);
  const [signedInAdminEmail, setSignedInAdminEmail] = useState(null);
  const applyRef = useRef(() => {});

  const applyFirebaseUser = useCallback((firebaseUser) => {
    if (firebaseUser && isAdminEmail(firebaseUser.email)) {
      setUser(null);
      setSignedInAdminEmail(firebaseUser.email);
    } else {
      setUser(firebaseUser);
      setSignedInAdminEmail(null);
    }
  }, []);

  applyRef.current = applyFirebaseUser;

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      try {
        await authReady;
      } catch { /* use default persistence */ }

      try {
        await googleRedirectResultPromise;
      } catch (err) {
        if (!cancelled) setGoogleAuthError(err);
      }

      if (cancelled) return;

      // Sync immediately after redirect result (before first paint of routes)
      applyRef.current(auth.currentUser);

      if (isGoogleRedirectReturn() && !auth.currentUser) {
        setGoogleAuthError({
          code: 'auth/redirect-failed',
          message: 'Google sign-in did not complete. Check Firebase authorized domains and API key referrers.',
        });
      }

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (cancelled) return;
        applyRef.current(firebaseUser);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    applyFirebaseUser(cred.user);
    return cred;
  };

  const signup = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    applyFirebaseUser(cred.user);
    return cred;
  };

  const resetPassword = (email) =>
    sendPasswordResetEmail(auth, email.trim());

  const loginWithGoogle = async () => {
    setGoogleAuthError(null);
    await authReady.catch(() => {});

    if (shouldUseGoogleRedirect()) {
      await signInWithRedirect(auth, googleProvider);
      return { redirected: true };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      applyFirebaseUser(result.user);
      return result;
    } catch (err) {
      // COOP / Chrome quirks: popup may close while auth still succeeded
      if (auth.currentUser) {
        applyFirebaseUser(auth.currentUser);
        return { user: auth.currentUser };
      }

      if (isPopupCancelled(err)) {
        throw err;
      }

      // Popup blocked or failed — fall back to redirect
      await signInWithRedirect(auth, googleProvider);
      return { redirected: true };
    }
  };

  const clearGoogleAuthError = () => setGoogleAuthError(null);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setSignedInAdminEmail(null);
  };

  const getToken = useCallback(async (forceRefresh = false) => {
    await authReady.catch(() => {});
    const current = auth.currentUser;
    if (!current || isAdminEmail(current.email)) return null;
    try {
      return await current.getIdToken(forceRefresh);
    } catch {
      if (!forceRefresh) {
        try {
          return await current.getIdToken(true);
        } catch {
          return null;
        }
      }
      return null;
    }
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        resetPassword,
        loginWithGoogle,
        googleAuthError,
        clearGoogleAuthError,
        signedInAdminEmail,
        logout,
        getToken,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
