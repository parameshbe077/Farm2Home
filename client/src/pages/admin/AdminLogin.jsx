import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const { user, isAdmin, loading, login, logout } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="admin-loading"><p>Loading…</p></div>;
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSignOutOther = async () => {
    setError('');
    try {
      await logout();
    } catch (err) {
      setError(err.message || 'Could not sign out');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password. Check Firebase Authentication → Users.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/password sign-in is disabled. Enable it in Firebase Console → Authentication.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Wait a few minutes and try again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection and that the dev server is running.');
      } else if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
        setError('Firebase API key rejected. Add this site to Google Cloud key restrictions (see below).');
      } else {
        setError(
          code
            ? `Login failed (${code.replace('auth/', '')}). See ADMIN_SETUP.md`
            : 'Login failed. Try again.',
        );
      }
      console.error('Admin login error:', code, err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <div className="admin-login__brand">
          <span>🌾</span>
          <h1>Farm2Home Admin</h1>
          <p>Sign in to manage products and orders</p>
        </div>
        {user && !isAdmin && (
          <div className="admin-login__notice">
            <p>
              Signed in as <strong>{user.email}</strong> (customer account).
              Sign out to use an admin account.
            </p>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--full" onClick={handleSignOutOther}>
              Sign out customer account
            </button>
          </div>
        )}
        {error && <p className="admin-login__error">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="admin@farm2home.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary admin-btn--full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="/" className="admin-login__back">← Back to store</a>
      </form>
    </div>
  );
}
