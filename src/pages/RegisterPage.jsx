import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, CreditCard } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, error: storeError, isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: '', bloodGroup: '', aadharNumber: '', panNumber: '',
    dob: '', address: '', avatarUrl: '',
    licenseNumber: '', licenseValidity: '', licensePhoto: null,
    hasOwnVehicle: true, licenseCategory: ''
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    if (roleParam || emailParam || nameParam) {
      setForm(prev => ({
        ...prev,
        role: roleParam || prev.role,
        email: emailParam || prev.email,
        name: nameParam || prev.name,
      }));
    }
  }, [searchParams]);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.role) {
      addToast('Please select a role (Passenger, Agent, or Owner).', 'error');
      return;
    }
    const trimmedName = form.name.trim().replace(/\s+/g, ' ');
    if (!/^[a-zA-Z]+(\s+[a-zA-Z]+)+$/.test(trimmedName)) {
      addToast('Please enter your First Middle Last name (at least First and Last name, alphabets only).', 'error');
      return;
    }
    const cleanPhone = form.phone.replace(/^\+?91/, '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      addToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      addToast('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.', 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setStep(2);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateForm('avatarUrl', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateForm('licensePhoto', file);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    const cleanPhone = form.phone.replace(/^\+?91/, '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      addToast('Phone number must be exactly 10 digits.', 'error');
      return;
    }
    if (form.role === 'driver') {
      if (form.hasOwnVehicle === undefined || form.hasOwnVehicle === null) {
        addToast('Please select your vehicle ownership status.', 'error');
        return;
      }
      if (!form.licenseCategory) {
        addToast('Please select your license category.', 'error');
        return;
      }
    }
    const cleanAadhar = form.aadharNumber.replace(/\D/g, '');
    if (!/^\d{12}$/.test(cleanAadhar)) {
      addToast('Aadhaar number is mandatory and must be exactly 12 digits.', 'error');
      return;
    }
    if (form.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.panNumber.toUpperCase())) {
      addToast('Invalid PAN format. Expected format: ABCDE1234F', 'error');
      return;
    }

    setIsLoading(true);
    
    const user = await register(form);
    setIsLoading(false);
    
    if (user) {
      addToast('Account created! Please verify your email and phone.', 'success');
      navigate('/verify');
    } else {
      const errorMsg = useAuthStore.getState().error || 'Registration failed. Please try again.';
      addToast(errorMsg, 'error');
    }
  };

  const handleGoogleAuth = () => {
    if (!form.role) {
      addToast('Please select your role first from the dropdown.', 'error');
      return;
    }
    useAuthStore.getState().signInWithGoogle(form.role);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <img src="/logo.png" alt="YatraGo" className="auth-brand-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', objectFit: 'contain' }} />
          <span className="auth-brand-name">YatraGo</span>
        </div>
        <h1 className="auth-hero-title">
          Start Your<br />
          <span>Adventure</span> Today
        </h1>
        <p className="auth-hero-desc">
          Create your account in just 2 steps. Verify your identity to unlock
          secure booking, wallet payments, and real-time trip tracking.
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '48px', alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white'
          }}>1</div>
          <div style={{ flex: 1, height: 2, background: step >= 2 ? 'var(--color-accent-teal)' : 'var(--color-surface-elevated)' }} />
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: step >= 2 ? 'var(--gradient-primary)' : 'var(--color-surface-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            color: step >= 2 ? 'white' : 'var(--color-text-tertiary)'
          }}>2</div>
          <div style={{ flex: 1, height: 2, background: 'var(--color-surface-elevated)' }} />
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--color-surface-elevated)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            color: 'var(--color-text-tertiary)'
          }}>✓</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          <span style={{ width: 40, textAlign: 'center' }}>Account</span>
          <span style={{ flex: 1 }} />
          <span style={{ width: 40, textAlign: 'center' }}>Details</span>
          <span style={{ flex: 1 }} />
          <span style={{ width: 40, textAlign: 'center' }}>Verify</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card" key={step}>
          {step === 1 ? (
            <>
              <h2>Create Account</h2>
              <p className="auth-subtitle">Step 1: Basic information</p>

              <form onSubmit={handleStep1}>
                <div className="form-group">
                  <label className="form-label">I am a</label>
                  <select className="form-select" value={form.role} onChange={e => updateForm('role', e.target.value)}>
                    <option value="" disabled>Select your role</option>
                    <option value="passenger">Passenger</option>
                    <option value="agent">Travel Agent</option>
                    <option value="owner">Vehicle Owner</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name (First Middle Last)</label>
                  <div className="form-input-icon-wrapper">
                    <User className="form-input-icon" size={20} />
                    <input type="text" className="form-input" placeholder="e.g. Rahul Kumar Sharma"
                      value={form.name} onChange={e => updateForm('name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="form-input-icon-wrapper">
                    <Mail className="form-input-icon" size={20} />
                    <input type="email" className="form-input" placeholder="you@example.com"
                      value={form.email} onChange={e => updateForm('email', e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div className="form-input-icon-wrapper" style={{ position: 'relative' }}>
                    <Phone className="form-input-icon" size={20} />
                    <span style={{ position: 'absolute', left: '44px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem', pointerEvents: 'none', zIndex: 2 }}>+91</span>
                    <input type="tel" className="form-input" style={{ paddingLeft: '76px' }} placeholder="98765 43210"
                      value={form.phone} onChange={e => {
                        const val = e.target.value.replace(/^\+?91/, '').replace(/\D/g, '').slice(0, 10);
                        updateForm('phone', val);
                      }} required maxLength={10} inputMode="numeric" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Min 8 chars, Aa, 123, !@#"
                      value={form.password} onChange={e => updateForm('password', e.target.value)} required minLength={8} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm</label>
                    <input type="password" className="form-input" placeholder="Re-enter password"
                      value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: '8px' }}>
                  Continue →
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>Personal Details</h2>
              <p className="auth-subtitle">Step 2: Verification details</p>

              <form onSubmit={handleStep2}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={form.bloodGroup} onChange={e => updateForm('bloodGroup', e.target.value)}>
                      <option value="">Select</option>
                      {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-input" value={form.dob} onChange={(e) => updateForm('dob', e.target.value)} required />
                  </div>
                </div>

                <div className="form-divider" />

                <div className="form-group">
                  <label className="form-label">Aadhaar Number <span style={{ color: 'var(--color-accent-red, #ef4444)' }}>*</span></label>
                  <div className="form-input-icon-wrapper">
                    <CreditCard className="form-input-icon" size={20} />
                    <input type="text" className="form-input" placeholder="12-digit Aadhaar Number"
                      value={form.aadharNumber} onChange={e => updateForm('aadharNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                      required maxLength={12} inputMode="numeric" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">PAN Number (Optional)</label>
                  <div className="form-input-icon-wrapper">
                    <CreditCard className="form-input-icon" size={20} />
                    <input type="text" className="form-input" placeholder="ABCDE1234F"
                      value={form.panNumber} onChange={e => updateForm('panNumber', e.target.value.toUpperCase())}
                      maxLength={10} />
                  </div>
                </div>

                <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--color-surface)', border: 'var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundImage: form.avatarUrl ? `url(${form.avatarUrl})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden'
                  }}>
                    {!form.avatarUrl && <User size={24} color="var(--color-text-tertiary)" />}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="form-input" style={{ flex: 1, padding: '8px' }} />
                </div>
              </div>



              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Address</label>
                <input type="text" className="form-input" placeholder="Enter your full residential address" value={form.address} onChange={(e) => updateForm('address', e.target.value)} required />
              </div>

              {form.role === 'driver' && (
                <>
                  <div className="form-divider" />
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Driver License Details</h3>
                  <div className="form-group">
                    <label className="form-label">Driving License Number</label>
                    <div className="form-input-icon-wrapper">
                      <CreditCard className="form-input-icon" size={20} />
                      <input type="text" className="form-input" placeholder="e.g. MH1420110062821"
                        value={form.licenseNumber} onChange={e => updateForm('licenseNumber', e.target.value)}
                        required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">License Validity Date</label>
                      <input type="date" className="form-input" value={form.licenseValidity} onChange={(e) => updateForm('licenseValidity', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">License Photo</label>
                      <input type="file" accept="image/*" onChange={handleLicenseUpload} className="form-input" style={{ padding: '8px' }} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Ownership</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="hasOwnVehicle" checked={form.hasOwnVehicle === true} onChange={() => updateForm('hasOwnVehicle', true)} />
                        I own a vehicle (and will register it later)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="hasOwnVehicle" checked={form.hasOwnVehicle === false} onChange={() => updateForm('hasOwnVehicle', false)} />
                        I do not own a vehicle, but I can drive (Hire me)
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Category</label>
                    <select className="form-select" value={form.licenseCategory} onChange={e => updateForm('licenseCategory', e.target.value)} required>
                      <option value="" disabled>Select your license category</option>
                      <option value="LMV">Light Motor Vehicle (LMV)</option>
                      <option value="Transport Vehicle">Transport Vehicle</option>
                      <option value="Commercial">Commercial License</option>
                      <option value="HMV">Heavy Motor Vehicle (HMV)</option>
                    </select>
                  </div>
                </>
              )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading}>
                    {isLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <button type="button" onClick={handleGoogleAuth} className="btn" style={{ 
              width: '100%', 
              background: 'white', 
              color: 'var(--color-bg-primary)', 
              justifyContent: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 20, height: 20, marginRight: 8 }} />
              Sign up with Google
            </button>
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
