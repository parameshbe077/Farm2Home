import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { isAdminEmail } from '../utils/adminAccess';
import { isDeliveryStaff } from '../utils/deliveryAccess';

const DeliveryAuthContext = createContext(null);

async function canUseDelivery(user) {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  return isDeliveryStaff(user);
}

export function DeliveryAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isDelivery, setIsDelivery] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ticket = 0;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const current = ++ticket;
      setLoading(true);
      setUser(firebaseUser);
      canUseDelivery(firebaseUser).then((allowed) => {
        if (current !== ticket) return;
        setIsDelivery(allowed);
        setLoading(false);
      });
    });
    return () => {
      ticket += 1;
      unsubscribe();
    };
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const resetPassword = (email) =>
    sendPasswordResetEmail(auth, email.trim());

  const logout = () => signOut(auth);

  const getToken = useCallback(async () => {
    const current = auth.currentUser;
    if (!current || !(await canUseDelivery(current))) return null;
    return current.getIdToken();
  }, []);

  return (
    <DeliveryAuthContext.Provider value={{ user, isDelivery, loading, login, resetPassword, logout, getToken }}>
      {children}
    </DeliveryAuthContext.Provider>
  );
}

export function useDeliveryAuth() {
  const ctx = useContext(DeliveryAuthContext);
  if (!ctx) throw new Error('useDeliveryAuth must be used within DeliveryAuthProvider');
  return ctx;
}
