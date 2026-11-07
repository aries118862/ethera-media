import { ArrowRight, Eye, EyeOff, Facebook, Instagram, LockKeyhole, Music2, Youtube } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiRequest, isCreatorUser } from '../services/api.js';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';
import CreatorAvatar from '../components/CreatorAvatar.jsx';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [viewerSignup, setViewerSignup] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { profile } = useCreatorProfile();

  const completeCreatorLogin = useCallback(async (credential) => {
    setError('');
    setSubmitting(true);
    try {
      const result = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      localStorage.setItem('ethera-token', result.token);
      const user = isCreatorUser(result.user) ? { ...result.user, role: 'creator' } : result.user;
      localStorage.setItem('ethera-user', JSON.stringify(user));
      navigate(isCreatorUser(user) ? '/dashboard' : '/explore');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => completeCreatorLogin(response.credential),
      });
      const button = document.getElementById('google-signin-button');
      if (button && window.google?.accounts.id) {
        window.google.accounts.id.renderButton(button, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: 320,
        });
      }
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [completeCreatorLogin]);

  if (localStorage.getItem('ethera-token')) {
    const user = JSON.parse(localStorage.getItem('ethera-user') || 'null');
    return <Navigate to={isCreatorUser(user) ? '/dashboard' : '/explore'} replace />;
  }

  async function handleViewerAuth(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await apiRequest(viewerSignup ? '/auth/viewer/register' : '/auth/viewer/login', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      localStorage.setItem('ethera-token', result.token);
      localStorage.setItem('ethera-user', JSON.stringify(result.user));
      navigate('/explore');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-welcome" aria-label={`${profile.name} profile`}>
          <div className="login-brand"><CreatorAvatar profile={profile} className="login-brand-avatar" /><span>{profile.name}</span></div>
          <div className="login-welcome-copy">
            <h2>Step into<br /><em>{profile.name}'s world.</em></h2>
            <span>The latest videos, posts and conversations from {profile.name}.</span>
          </div>
          <div className="login-visual" aria-hidden="true">
            <span className="login-social-icon login-social-youtube"><Youtube size={27} /></span>
            <span className="login-social-icon login-social-facebook"><Facebook size={25} /></span>
            <span className="login-social-icon login-social-instagram"><Instagram size={25} /></span>
            <span className="login-social-icon login-social-tiktok"><Music2 size={26} /></span>
          </div>
          <div className="login-welcome-footer">The official {profile.name} community</div>
        </section>
        <section className="login-card">
          <span className="login-icon"><LockKeyhole size={18} /></span>
          <h1>{viewerSignup ? 'Create account' : 'Log in'}</h1>
          <div className="social-login-options">
            {GOOGLE_CLIENT_ID
              ? <div id="google-signin-button" className="google-signin-button" />
              : <p className="provider-unavailable">Google sign-in is unavailable.</p>}
          </div>
          <div className="login-divider"><span>or</span></div>
          <form onSubmit={handleViewerAuth} className="login-form">
            {viewerSignup && <label>Name<input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" autoComplete="name" maxLength={80} required /></label>}
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" required /></label>
            <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete={viewerSignup ? 'new-password' : 'current-password'} minLength={viewerSignup ? 8 : undefined} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {!viewerSignup && <button type="button" className="forgot-password" onClick={() => setResetMessage('Password reset is not available yet. Contact the site administrator.')}>Forgot password?</button>}
            <button type="submit" className="button button-dark login-submit" disabled={submitting}>{submitting ? 'Please wait...' : viewerSignup ? 'Create account' : 'Log in'} <ArrowRight size={16} /></button>
          </form>
          {error && <div className="notice notice-error login-error">{error}</div>}
          {resetMessage && <p className="login-reset-message" role="status">{resetMessage}</p>}
          <button type="button" className="creator-login-toggle" onClick={() => { setViewerSignup(!viewerSignup); setError(''); setResetMessage(''); }}>
            {viewerSignup ? 'Log in' : 'Create account'}
          </button>
        </section>
      </div>
    </main>
  );
}
