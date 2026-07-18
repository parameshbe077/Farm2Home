import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

function resolveLoginError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Check Firebase Authentication → Users.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is disabled. Enable it in Firebase Console → Authentication.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and that the dev server is running.';
  }
  if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
    return 'Firebase API key rejected. Add this site to Google Cloud key restrictions (see below).';
  }
  return code
    ? `Login failed (${code.replace('auth/', '')}). See ADMIN_SETUP.md`
    : 'Login failed. Try again.';
}

function resolveResetError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection.';
  }
  return err?.message || 'Could not send reset email. Try again.';
}

export default function AdminLogin() {
  const { user, isAdmin, loading, login, resetPassword, logout } = useAdminAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="admin-loading"><p>Loading…</p></div>;
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleSignOutOther = async () => {
    setError('');
    setSuccess('');
    try {
      await logout();
    } catch (err) {
      setError(err.message || 'Could not sign out');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(resolveLoginError(err));
      console.error('Admin login error:', err?.code, err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess('Check your inbox for a password reset link. It may take a minute to arrive.');
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setSuccess('Check your inbox for a password reset link. It may take a minute to arrive.');
      } else {
        setError(resolveResetError(err));
      }
      console.error('Admin reset error:', err?.code, err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <img src="/logo_f2h.png" alt="Farm2Home" className="logo__img" />
          <h1>Farm2Home Admin</h1>
          <p>
            {mode === 'forgot'
              ? 'Enter your admin email to receive a reset link'
              : 'Sign in to manage products and orders'}
          </p>
        </div>
        {user && !isAdmin && mode === 'signin' && (
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
        {success && <p className="admin-login__success">{success}</p>}

        {mode === 'forgot' ? (
          <form onSubmit={handleResetSubmit}>
            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@farm2home.com"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary admin-btn--full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              className="admin-login__text-btn"
              onClick={() => switchMode('signin')}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
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
              <div className="admin-login__label-row">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="admin-login__forgot"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
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
          </form>
        )}

        <a href="/" className="admin-login__back">← Back to store</a>
      </div>
    </div>
  );
}
