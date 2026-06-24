import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { googleRedirectResultPromise, isGoogleRedirectReturn } from '../firebase/authBootstrap';
import { isAdminEmail } from '../utils/adminAccess';

const CustomerAuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function shouldUseGoogleRedirect() {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAuthError, setGoogleAuthError] = useState(null);
  const [signedInAdminEmail, setSignedInAdminEmail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    const applyFirebaseUser = (firebaseUser) => {
      if (firebaseUser && isAdminEmail(firebaseUser.email)) {
        setUser(null);
        setSignedInAdminEmail(firebaseUser.email);
      } else {
        setUser(firebaseUser);
        setSignedInAdminEmail(null);
      }
    };

    (async () => {
      try {
        await googleRedirectResultPromise;
      } catch (err) {
        if (!cancelled) setGoogleAuthError(err);
      }

      if (cancelled) return;

      if (isGoogleRedirectReturn() && !auth.currentUser) {
        setGoogleAuthError({
          code: 'auth/redirect-failed',
          message: 'Google sign-in did not complete. Check Firebase authorized domains and API key referrers.',
        });
      }

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (cancelled) return;
        applyFirebaseUser(firebaseUser);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email.trim(), password);

  const loginWithGoogle = async () => {
    setGoogleAuthError(null);

    if (shouldUseGoogleRedirect()) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (
        err?.code === 'auth/popup-closed-by-user'
        || err?.code === 'auth/cancelled-popup-request'
      ) {
        throw err;
      }
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
  };

  const clearGoogleAuthError = () => setGoogleAuthError(null);

  const logout = () => signOut(auth);

  const getToken = useCallback(async (forceRefresh = false) => {
    const current = auth.currentUser;
    if (!current) return null;
    return current.getIdToken(forceRefresh);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
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
