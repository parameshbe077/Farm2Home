import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import PageBanner from '../components/PageBanner';
import GoogleIcon from '../components/GoogleIcon';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { auth } from '../firebase/config';

async function resolveAuthError(err, mode, email) {
  const code = err?.code || '';
  const trimmedEmail = email.trim();

  if (mode === 'signup' && code === 'auth/email-already-in-use') {
    return 'This email already has an account. Please use Sign in instead.';
  }

  if (mode === 'signin' && (
    code === 'auth/invalid-credential'
    || code === 'auth/wrong-password'
    || code === 'auth/user-not-found'
  )) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
      if (methods.length === 0) {
        return 'No account found with this email. Please use Sign up to create one.';
      }
      return 'Incorrect password for this email. Please try again.';
    } catch {
      return 'Could not sign in. If this is a new email, please use Sign up first.';
    }
  }

  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email or Google sign-in is disabled in Firebase Console.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection.';
  }

  return err?.message || 'Something went wrong. Try again.';
}

export default function CustomerLogin() {
  const { user, loading, login, signup, loginWithGoogle } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/my-orders';

  if (loading) {
    return <div className="auth-loading"><p>Loading…</p></div>;
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(await resolveAuthError(err, mode, email));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(await resolveAuthError(err, mode, email));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-page-wrap">
      <PageBanner
        label="Account"
        title={mode === 'signin' ? 'Welcome back' : 'Join Farm2Home'}
        subtitle="Sign in to order fresh produce and track your deliveries"
      />
      <div className="container auth-page">
        <div className="auth-card">
          <div className="auth-card__brand">
            <span className="auth-card__brand-icon" aria-hidden>🌾</span>
            <p>Farm-fresh orders, saved to your account</p>
          </div>

          <div className="auth-card__tabs" role="tablist" aria-label="Account mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-card__tab${mode === 'signin' ? ' auth-card__tab--active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-card__tab${mode === 'signup' ? ' auth-card__tab--active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Sign up
            </button>
          </div>

          {error && <p className="auth-card__error" role="alert">{error}</p>}

          <button
            type="button"
            className="auth-card__google-btn"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <GoogleIcon size={20} />
            <span>Continue with Google</span>
          </button>

          <div className="auth-card__divider"><span>or use email</span></div>

          <form className="auth-card__form" onSubmit={handleEmailSubmit}>
            <div className="form-group auth-card__field">
              <label htmlFor="customer-email">Email address</label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group auth-card__field">
              <label htmlFor="customer-password">Password</label>
              <input
                id="customer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="At least 6 characters"
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full auth-card__submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="auth-card__footer">
            <p className="auth-card__hint">
              Secure checkout · Order history · Cash on delivery
            </p>
            <Link to="/products" className="auth-card__back">← Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
