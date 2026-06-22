import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';

const CustomerAuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email.trim(), password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const logout = () => signOut(auth);

  const getToken = async () => {
    if (!user) return null;
    return user.getIdToken();
  };

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
