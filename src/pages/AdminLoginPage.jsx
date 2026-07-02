import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, clearError } = useAuthStore();
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    // Hardcode role to 'admin'
    const success = await login(email, password, 'admin');
    setIsLoading(false);

    let isAuth = useAuthStore.getState().isAuthenticated;
    if (!success && !isAuth) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isAuth = useAuthStore.getState().isAuthenticated;
    }

    if (success || isAuth) {
      addToast('Welcome Admin! Access granted.', 'success');
      navigate('/admin');
    } else {
      const storeError = useAuthStore.getState().error;
      addToast(storeError || 'Admin login failed. Unauthorized access.', 'error');
    }
  };

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-right" style={{ maxWidth: '500px', width: '100%', margin: '0 auto' }}>
        <div className="auth-card" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <ShieldCheck size={48} color="var(--color-accent-blue)" style={{ margin: '0 auto 16px' }} />
            <h2>Admin Portal Access</h2>
            <p className="auth-subtitle">Restricted to authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email Address</label>
              <div className="form-input-icon-wrapper">
                <Mail className="form-input-icon" size={20} />
                <input type="email" className="form-input" placeholder="admin@yatrago.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Security Key / Password</label>
              <div className="form-input-icon-wrapper">
                <Lock className="form-input-icon" size={20} />
                <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="form-input-icon form-input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading} style={{ marginTop: '24px' }}>
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
