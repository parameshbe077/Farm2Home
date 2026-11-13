import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDeliveryAuth } from '../../context/DeliveryAuthContext';

function resolveLoginError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection.';
  }
  return err?.message || 'Login failed. Try again.';
}

export default function DeliveryLogin() {
  const { user, isDelivery, loading, login, resetPassword, logout } = useDeliveryAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="admin-loading"><p>Loading…</p></div>;
  }

  if (user && isDelivery) {
    return <Navigate to="/delivery" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(resolveLoginError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess('Check your inbox for a password reset link.');
    } catch (err) {
      setError(err?.message || 'Could not send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <img src="/logo_f2h.png" alt="Farm2Home" className="logo__img" />
          <h1>Farm2Home Delivery</h1>
          <p>Sign in to see orders and open the route</p>
        </div>
        {user && !isDelivery && (
          <div className="admin-login__notice">
            <p>
              Signed in as <strong>{user.email}</strong>. This account is not a delivery account.
            </p>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--full" onClick={() => logout()}>
              Sign out
            </button>
          </div>
        )}
        {error && <p className="admin-login__error">{error}</p>}
        {success && <p className="admin-login__success">{success}</p>}
        {mode === 'forgot' ? (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label htmlFor="delivery-reset-email">Email</label>
              <input
                id="delivery-reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary admin-btn--full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <button type="button" className="admin-login__text-btn" onClick={() => setMode('signin')}>
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="delivery-email">Email</label>
              <input
                id="delivery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="delivery-password">Password</label>
              <input
                id="delivery-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary admin-btn--full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" className="admin-login__text-btn" onClick={() => setMode('forgot')}>
              Forgot password?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
