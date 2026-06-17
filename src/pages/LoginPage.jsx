import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Car, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('passenger');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: 'passenger', label: 'Passenger', desc: 'Book trips & parcels', icon: '🧳' },
    { id: 'agent', label: 'Travel Agent', desc: 'Book for customers', icon: '💼' },
    { id: 'owner', label: 'Vehicle Owner', desc: 'Register vehicles', icon: '🚗' },
    { id: 'admin', label: 'Admin', desc: 'Manage platform', icon: '🛡️' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    const success = await login(email, password, selectedRole);
    setIsLoading(false);

    if (success) {
      addToast('Welcome back! Login successful.', 'success');
      const dest = selectedRole === 'agent' ? '/agent'
        : selectedRole === 'owner' ? '/owner'
        : selectedRole === 'admin' ? '/admin'
        : '/dashboard';
      navigate(dest);
    } else {
      // Error is handled by the store and displayed via the `error` state variable
      addToast('Login failed. Please check your credentials.', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">✈</div>
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
                <div className="role-option-desc">{role.desc}</div>
              </div>
            ))}
          </div>

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
              <label className="form-label">Password</label>
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

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={isLoading}
              style={{ marginTop: '8px' }}
            >
              {isLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
