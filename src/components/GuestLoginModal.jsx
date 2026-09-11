/**
 * GuestLoginModal — single reusable auth modal for guest-mode users.
 *
 * Mounted once inside AppLayout. Triggered via useGuestLoginModalStore.openModal().
 * After successful login:
 *   1. Reads pendingAction.resumeFn from useGuestStore
 *   2. Calls resumeFn() — resumes exactly what the guest was trying to do
 *   3. Clears the pending action
 *   4. Closes itself
 *
 * Backdrop click / Escape → close only (guest stays on current page).
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, Eye, EyeOff, User, Phone, Luggage, Briefcase, Car, LogIn, UserPlus } from 'lucide-react';
import {
  useAuthStore, useToastStore,
  useGuestLoginModalStore, useGuestStore,
} from '../store';
import { supabase } from '../supabaseClient';

// ── Role chip for sign-up tab ──────────────────────────────────────────────────
const ROLES = [
  { id: 'passenger', label: 'Passenger',     icon: <Luggage size={18} /> },
  { id: 'agent',     label: 'Travel Agent',  icon: <Briefcase size={18} /> },
  { id: 'owner',     label: 'Vehicle Owner', icon: <Car size={18} /> },
];

export default function GuestLoginModal() {
  const { isOpen, defaultTab, closeModal } = useGuestLoginModalStore();
  const { pendingAction, clearPendingAction } = useGuestStore();
  const { login, isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [tab,          setTab]          = useState(defaultTab);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [role,         setRole]         = useState('passenger');
  const [isLoading,    setIsLoading]    = useState(false);

  // Sync tab when modal reopens with a different defaultTab
  useEffect(() => { setTab(defaultTab); }, [defaultTab, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail(''); setPassword(''); setName(''); setPhone('');
      setShowPass(false); setIsLoading(false);
    }
  }, [isOpen]);

  // ── Resume pending action after auth ──────────────────────────────────────
  const resumeAndClose = useCallback(() => {
    closeModal();
    if (!pendingAction) return;

    const { resumeFn, type, payload } = pendingAction;
    clearPendingAction();

    if (type === 'navigate' && payload?.path) {
      navigate(payload.path, { state: payload.state });
      return;
    }
    if (typeof resumeFn === 'function') {
      // Small tick to let auth state propagate before the action runs
      setTimeout(resumeFn, 80);
    }
  }, [pendingAction, clearPendingAction, closeModal, navigate]);

  // Watch for auth becoming true while modal is open
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      addToast(`Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}! 🎉`, 'success');
      resumeAndClose();
    }
  }, [isAuthenticated, user, isOpen, resumeAndClose, addToast]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  // ── Sign In handler ────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) { addToast('Enter email and password.', 'error'); return; }
    setIsLoading(true);
    const success = await login(email, password, 'passenger');
    setIsLoading(false);
    if (!success) {
      // Auth state may still update via onAuthStateChange — the useEffect above handles it
      await new Promise(r => setTimeout(r, 700));
      if (!useAuthStore.getState().isAuthenticated) {
        addToast('Invalid email or password. Please try again.', 'error');
      }
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    localStorage.setItem('oauth_intended_role', role);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  // ── Quick Sign Up (email + password) ─────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      addToast('All fields are required to create an account.', 'error'); return;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      addToast('Phone must be 10 digits.', 'error'); return;
    }
    setIsLoading(true);
    try {
      // 1. Create Supabase auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, intended_role: role } },
      });
      if (signUpError) throw signUpError;

      const authId = signUpData?.user?.id;
      if (!authId) throw new Error('Could not create auth user.');

      // 2. Insert into public.users
      const { error: insertError } = await supabase.from('users').insert([{
        id:    authId,
        email, name,
        phone: phone.replace(/\D/g, ''),
        role,
        email_verified: false,
        phone_verified: false,
      }]);
      if (insertError && !insertError.message?.includes('duplicate')) throw insertError;

      // 3. Sign in immediately so onAuthStateChange fires
      await login(email, password, role);
    } catch (err) {
      addToast(err.message || 'Sign up failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Context label for pending action ──────────────────────────────────────
  const pendingLabel = pendingAction?.type === 'booking' ? 'complete your booking'
    : pendingAction?.type === 'parcel'   ? 'send your parcel'
    : pendingAction?.type === 'rental'   ? 'confirm your rental'
    : pendingAction?.type === 'navigate' ? 'continue'
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeModal}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        role="dialog" aria-modal="true" aria-label="Sign in to YatraGo"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, pointerEvents: 'none',
        }}
      >
        <div
          className="animate-scale-in"
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'all',
            width: '100%', maxWidth: 440,
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 0',
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                {tab === 'signin' ? '👋 Welcome back' : '🚀 Join YatraGo'}
              </div>
              {pendingLabel && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-accent-teal-light)', marginTop: 3 }}>
                  Sign in to {pendingLabel}
                </div>
              )}
            </div>
            <button
              id="guest-modal-close"
              className="btn btn-ghost btn-icon"
              onClick={closeModal}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, padding: '16px 24px 0', borderBottom: '1px solid var(--color-border)' }}>
            {[{ id: 'signin', label: 'Sign In', icon: <LogIn size={14} /> },
              { id: 'signup', label: 'Sign Up', icon: <UserPlus size={14} /> }].map(t => (
              <button
                key={t.id}
                id={`modal-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '9px 0', fontWeight: 700, fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderBottom: tab === t.id ? '2px solid var(--color-accent-teal)' : '2px solid transparent',
                  color: tab === t.id ? 'var(--color-accent-teal-light)' : 'var(--color-text-tertiary)',
                  background: 'none', border: 'none', cursor: 'pointer', marginBottom: -1,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            {/* ── SIGN IN ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="form-input-icon-wrapper">
                    <Mail className="form-input-icon" size={18} />
                    <input
                      id="modal-signin-email"
                      type="email" className="form-input"
                      placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email" required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-input-icon-wrapper">
                    <Lock className="form-input-icon" size={18} />
                    <input
                      id="modal-signin-password"
                      type={showPass ? 'text' : 'password'} className="form-input"
                      placeholder="Your password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password" required
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  id="modal-signin-submit"
                  type="submit" className="btn btn-primary btn-lg btn-full"
                  style={{ marginTop: 4 }} disabled={isLoading}
                >
                  {isLoading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign In'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                <button
                  id="modal-google-signin"
                  type="button" className="btn btn-secondary btn-lg btn-full"
                  onClick={handleGoogle} disabled={isLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  New to YatraGo?{' '}
                  <button type="button" onClick={() => setTab('signup')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-teal-light)', fontWeight: 700, cursor: 'pointer' }}>
                    Create account
                  </button>
                </div>
              </form>
            )}

            {/* ── SIGN UP ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp}>
                {/* Role selection */}
                <div style={{ marginBottom: 14 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>I am a…</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ROLES.map(r => (
                      <button key={r.id} type="button"
                        id={`modal-role-${r.id}`}
                        onClick={() => setRole(r.id)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-md)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          fontSize: '0.72rem', fontWeight: 700,
                          background: role === r.id ? 'rgba(27,153,139,0.18)' : 'var(--color-surface)',
                          border: role === r.id ? '2px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)',
                          color: role === r.id ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="form-input-icon-wrapper">
                    <User className="form-input-icon" size={18} />
                    <input id="modal-signup-name" className="form-input" placeholder="First Middle Last"
                      value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="form-input-icon-wrapper">
                      <Mail className="form-input-icon" size={18} />
                      <input id="modal-signup-email" type="email" className="form-input" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <div className="form-input-icon-wrapper">
                      <Phone className="form-input-icon" size={18} />
                      <input id="modal-signup-phone" type="tel" className="form-input" placeholder="10-digit"
                        value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} required />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-input-icon-wrapper">
                    <Lock className="form-input-icon" size={18} />
                    <input id="modal-signup-password"
                      type={showPass ? 'text' : 'password'} className="form-input"
                      placeholder="Min 8 characters"
                      value={password} onChange={e => setPassword(e.target.value)}
                      minLength={8} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  id="modal-signup-submit"
                  type="submit" className="btn btn-primary btn-lg btn-full"
                  style={{ marginTop: 4 }} disabled={isLoading}
                >
                  {isLoading
                    ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    : 'Create Account & Continue'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                <button type="button" className="btn btn-secondary btn-lg btn-full"
                  onClick={handleGoogle} disabled={isLoading} id="modal-google-signup">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>

                <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('signin')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-teal-light)', fontWeight: 700, cursor: 'pointer' }}>
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
