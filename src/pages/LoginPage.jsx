import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Car, ShieldCheck, Briefcase, Key, Luggage } from 'lucide-react';

const CustomDriverIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 2v7.5" />
    <path d="m3.3 17 6.5-3.8" />
    <path d="m20.7 17-6.5-3.8" />
  </svg>
);
import { useAuthStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, clearError, isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightGoogle, setHighlightGoogle] = useState(false);

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.role === 'admin' ? '/admin'
        : user.role === 'agent' ? '/agent'
        : user.role === 'owner' ? '/owner'
        : user.role === 'driver' ? '/driver'
        : '/dashboard';

      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const roles = [
    { id: 'passenger', label: 'Passenger', desc: 'Book trips & parcels', icon: <Luggage size={28} /> },
    { id: 'agent', label: 'Travel Agent', desc: 'Book for customers', icon: <Briefcase size={28} /> },
    { id: 'owner', label: 'Vehicle Owner', desc: 'Register vehicles', icon: <Car size={28} /> },
    { id: 'driver', label: 'Driver', desc: null, icon: <CustomDriverIcon size={28} /> },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      addToast('Please select your role first.', 'error');
      return;
    }
    clearError();
    setIsLoading(true);

    const success = await login(email, password, selectedRole);
    setIsLoading(false);

    let isAuth = useAuthStore.getState().isAuthenticated;
    if (!success && !isAuth) {
      // Give onAuthStateChange event window time to update the store
      await new Promise(resolve => setTimeout(resolve, 600));
      isAuth = useAuthStore.getState().isAuthenticated;
    }

    if (success || isAuth) {
      addToast('Welcome back! Login successful.', 'success');
      // Get the true role from the store (handles Admin bypass properly)
      const currentUser = useAuthStore.getState().user || user;
      const dest = currentUser?.role === 'admin' ? '/admin'
        : currentUser?.role === 'agent' ? '/agent'
        : currentUser?.role === 'owner' ? '/owner'
        : currentUser?.role === 'driver' ? '/driver'
        : '/dashboard';

      navigate(dest);
    } else {
      // Show actual error from store if available, or fallback
      const storeError = useAuthStore.getState().error;
      const errorMsg = storeError || 'Login failed. Please check your credentials.';
      addToast(errorMsg, 'error');

      if (errorMsg.includes('Google') || errorMsg.includes('Google se linked')) {
        setHighlightGoogle(true);
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
          googleBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      addToast('Please enter your email address', 'error');
      return;
    }
    
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      
      addToast('OTP sent to your email. Please check your inbox.', 'success');
      setForgotStep(2);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsResetting(true);
    try {
      // 1. Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: otp,
        type: 'recovery' // Or 'magiclink' depending on Supabase email templates, but recovery is standard for reset
      });
      
      if (verifyError) throw verifyError;
      
      // 2. Update Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      addToast('Password reset successfully! You can now login.', 'success');
      setShowForgot(false);
      setForgotStep(1);
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <img src="/logo.png" alt="YatraGo" className="auth-brand-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', objectFit: 'contain' }} />
          <span className="auth-brand-name">YatraGo</span>
        </div>
        <h1 className="auth-hero-title">
          Your Journey,<br />
          Our <span>Promise</span>
        </h1>
        <p className="auth-hero-desc">
          Book comfortable trips, send parcels, and travel with confidence.
          Real-time vehicle tracking, verified drivers, and secure wallet payments.
        </p>

        <div style={{ display: 'flex', gap: '24px', marginTop: '48px' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-teal-light)' }}>50K+</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>Happy Travelers</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-amber)' }}>200+</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>Verified Vehicles</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-purple)' }}>100+</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>Routes Active</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue your journey</p>

          {/* Role Selector */}
          <div className="role-selector">
            {roles.map(role => (
              <div
                key={role.id}
                className={`role-option ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="role-option-icon" style={{
                  background: selectedRole === role.id ? 'rgba(27,153,139,0.15)' : 'var(--color-surface)',
                }}>
                  {role.icon}
                </div>
                <div className="role-option-label">{role.label}</div>
                {role.desc && <div className="role-option-desc">{role.desc}</div>}
              </div>
            ))}
          </div>

          {showForgot ? (
            <div className="forgot-password-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Reset Password</h3>
                <button type="button" onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Back to Login
                </button>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleSendResetOtp}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                    Enter your registered email address and we'll send you an OTP to reset your password.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="form-input-icon-wrapper">
                      <Mail className="form-input-icon" size={20} />
                      <input
                        type="email" className="form-input" placeholder="you@example.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isResetting}>
                    {isResetting ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndReset}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                    Enter the 6-digit OTP sent to {forgotEmail} and set your new password.
                  </p>
                  <div className="form-group">
                    <label className="form-label">OTP Code</label>
                    <div className="form-input-icon-wrapper">
                      <Key className="form-input-icon" size={20} />
                      <input
                        type="text" className="form-input" placeholder="Enter 6-digit OTP"
                        value={otp} onChange={e => setOtp(e.target.value)} required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="form-input-icon-wrapper">
                      <Lock className="form-input-icon" size={20} />
                      <input
                        type="password" className="form-input" placeholder="New Password (min 6 chars)"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isResetting}>
                    {isResetting ? 'Resetting...' : 'Verify & Reset Password'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-icon-wrapper">
                <Mail className="form-input-icon" size={20} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--color-accent-teal)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginBottom: '8px' }}>
                  Forgot Password?
                </button>
              </div>
              <div className="form-input-icon-wrapper" style={{ position: 'relative' }}>
                <Lock className="form-input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-text-tertiary)',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            {highlightGoogle && (
              <div style={{ color: '#4285F4', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, textAlign: 'center', background: 'rgba(66, 133, 244, 0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(66, 133, 244, 0.3)' }}>
                ⭐ Aapka account Google se linked hai — Use this button below:
              </div>
            )}
            <button id="google-signin-btn" type="button" onClick={() => {
              if (!selectedRole) {
                addToast('Please select your role first.', 'error');
                return;
              }
              useAuthStore.getState().signInWithGoogle(selectedRole);
            }} className="btn" style={{ 
              width: '100%', 
              background: 'white', 
              color: 'var(--color-bg-primary)', 
              justifyContent: 'center',
              border: highlightGoogle ? '2px solid #4285F4' : '1px solid #e2e8f0',
              boxShadow: highlightGoogle ? '0 0 16px rgba(66, 133, 244, 0.6)' : 'none',
              transform: highlightGoogle ? 'scale(1.02)' : 'none',
              transition: 'all 0.3s ease',
              fontWeight: highlightGoogle ? 700 : 600
            }}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 20, height: 20, marginRight: 8 }} />
              Sign in with Google
            </button>
          </div>

          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
