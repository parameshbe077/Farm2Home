import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { isAdminEmail } from '../utils/adminAccess';

const CustomerAuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && isAdminEmail(firebaseUser.email)) {
        setUser(null);
      } else {
        setUser(firebaseUser);
      }
      setLoading(false);
    });
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email.trim(), password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

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
