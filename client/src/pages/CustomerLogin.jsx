import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import GoogleIcon from '../components/GoogleIcon';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { auth } from '../firebase/config';

async function resolveAuthError(err, mode) {
  const code = err?.code || '';

  if (mode === 'signup' && code === 'auth/email-already-in-use') {
    return 'This email already has an account. Sign in with your password, or use Continue with Google if you registered that way.';
  }

  // Firebase email enumeration protection makes fetchSignInMethodsForEmail return []
  // even when the account exists — so never treat "empty methods" as "no account".
  if (mode === 'signin' && (
    code === 'auth/invalid-credential'
    || code === 'auth/wrong-password'
    || code === 'auth/user-not-found'
  )) {
    return 'Incorrect email or password. If you signed up with Google, use Continue with Google instead — or use Forgot password to set one.';
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
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a few minutes and try again.';
  }

  return err?.message || 'Something went wrong. Try again.';
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

export default function CustomerLogin() {
  const {
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
  } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!googleAuthError) {
      setGoogleError('');
      return;
    }
    resolveAuthError(googleAuthError, mode).then(setGoogleError);
  }, [googleAuthError, mode]);

  const redirectTo = location.state?.from || '/my-orders';

  if (loading) {
    return <div className="auth-loading"><p>Loading…</p></div>;
  }

  if (signedInAdminEmail) {
    return (
      <div className="page auth-page-wrap">
        <PageBanner
          label="Account"
          title="Admin account"
          subtitle="This Google email is registered as an admin"
        />
        <div className="container auth-page">
          <div className="auth-card">
            <p className="auth-card__error" role="alert">
              <strong>{signedInAdminEmail}</strong> is an admin account, so it cannot shop as a customer.
              Use the admin panel, or sign in with a different Google account to order.
            </p>
            <Link to="/admin" className="btn btn--primary btn--full auth-card__submit">
              Go to admin panel
            </Link>
            <button
              type="button"
              className="auth-card__text-btn"
              onClick={async () => {
                await logout();
              }}
            >
              Sign out and use another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(await resolveAuthError(err, mode));
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
      // Avoid revealing whether the email is registered
      if (err?.code === 'auth/user-not-found') {
        setSuccess('Check your inbox for a password reset link. It may take a minute to arrive.');
      } else {
        setError(resolveResetError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSuccess('');
    clearGoogleAuthError();
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      // Redirect flow leaves the page; popup flow updates auth state.
      // <Navigate> below handles routing once `user` / admin email is set.
      if (result?.redirected) return;

      if (!result?.user && !auth.currentUser) {
        setError('Google sign-in did not finish. Please try again.');
      }
    } catch (err) {
      // Auth may still have completed despite a popup error
      if (auth.currentUser) return;
      setError(await resolveAuthError(err, mode));
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = error || googleError;
  const bannerTitle = mode === 'forgot'
    ? 'Reset password'
    : mode === 'signin'
      ? 'Welcome back'
      : 'Join Farm2Home';
  const bannerSubtitle = mode === 'forgot'
    ? 'Enter your email and we will send you a reset link'
    : 'Sign in to order fresh produce and track your deliveries';

  return (
    <div className="page auth-page-wrap">
      <PageBanner
        label="Account"
        title={bannerTitle}
        subtitle={bannerSubtitle}
      />
      <div className="container auth-page">
        <div className="auth-card">
          <div className="auth-card__brand">
            <img src="/logo_f2h.png" alt="Farm2Home" className="logo__img logo__img--sm" />
            <p>Farm-fresh orders, saved to your account</p>
          </div>

          {mode !== 'forgot' && (
            <div className="auth-card__tabs" role="tablist" aria-label="Account mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={`auth-card__tab${mode === 'signin' ? ' auth-card__tab--active' : ''}`}
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={`auth-card__tab${mode === 'signup' ? ' auth-card__tab--active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                Sign up
              </button>
            </div>
          )}

          {displayError && <p className="auth-card__error" role="alert">{displayError}</p>}
          {success && <p className="auth-card__success" role="status">{success}</p>}

          {mode === 'forgot' ? (
            <form className="auth-card__form" onSubmit={handleResetSubmit}>
              <div className="form-group auth-card__field">
                <label htmlFor="customer-reset-email">Email address</label>
                <input
                  id="customer-reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" className="btn btn--primary btn--full auth-card__submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
              <button
                type="button"
                className="auth-card__text-btn"
                onClick={() => switchMode('signin')}
              >
                ← Back to sign in
              </button>
            </form>
          ) : (
            <>
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
                  <div className="auth-card__label-row">
                    <label htmlFor="customer-password">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        className="auth-card__forgot"
                        onClick={() => switchMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
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
            </>
          )}

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
