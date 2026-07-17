import { useEffect, useState } from 'react';
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
  if (code === 'auth/unauthorized-domain') {
    return 'This website is not authorized for Google sign-in. In Firebase Console → Authentication → Settings → Authorized domains, add farm2home-drab.vercel.app';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/invalid-continue-uri') {
    return 'Google sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, enable Google.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection.';
  }
  if (code === 'auth/redirect-failed') {
    return 'Google sign-in did not finish. In Google Cloud → API key, add https://farm2home-759a4.firebaseapp.com/* and http://localhost/* to HTTP referrers.';
  }
  if (code === 'auth/invalid-action' || code === 'auth/internal-error') {
    return 'Google sign-in blocked. Enable Google in Firebase → Sign-in method and check API key referrers.';
  }

  return err?.message || 'Something went wrong. Try again.';
}

export default function CustomerLogin() {
  const {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    googleAuthError,
    clearGoogleAuthError,
    signedInAdminEmail,
  } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!googleAuthError) {
      setGoogleError('');
      return;
    }
    resolveAuthError(googleAuthError, mode, email).then(setGoogleError);
  }, [googleAuthError, mode, email]);

  const redirectTo = location.state?.from || '/my-orders';

  if (loading) {
    return <div className="auth-loading"><p>Loading…</p></div>;
  }

  if (signedInAdminEmail) {
    return <Navigate to="/admin" replace state={{ fromGoogle: true }} />;
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
    clearGoogleAuthError();
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user) {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(await resolveAuthError(err, mode, email));
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = error || googleError;

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
            <img src="/logo_f2h.png" alt="Farm2Home" className="logo__img logo__img--sm" />
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

          {displayError && <p className="auth-card__error" role="alert">{displayError}</p>}

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
