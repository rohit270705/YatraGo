import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user, verifyEmail, verifyPhone } = useAuthStore();
  const { addToast } = useToastStore();
  const [step, setStep] = useState('email'); // 'email' | 'phone' | 'done'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [step]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      addToast('Please enter the full 6-digit code', 'warning');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      if (step === 'email') {
        verifyEmail();
        addToast('Email verified successfully!', 'success');
        setOtp(['', '', '', '', '', '']);
        setTimer(30);
        setStep('phone');
      } else if (step === 'phone') {
        verifyPhone();
        addToast('Phone verified! Your account is fully verified.', 'success');
        setStep('done');
      }
      setIsVerifying(false);
    }, 1200);
  };

  const handleResend = () => {
    setTimer(30);
    addToast('Verification code resent!', 'info');
  };

  if (step === 'done') {
    return (
      <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            background: 'rgba(46, 204, 113, 0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            animation: 'scaleIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <CheckCircle size={40} color="var(--color-accent-green)" />
          </div>
          <h2 style={{ marginBottom: 8 }}>All Verified! 🎉</h2>
          <p className="auth-subtitle" style={{ marginBottom: 32 }}>
            Your email and phone number are verified. You're all set to book trips, send parcels, and more.
          </p>

          <div style={{
            display: 'flex', gap: 16, padding: '20px', background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)', marginBottom: 24, textAlign: 'left'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="var(--color-accent-green)" />
                {user?.email || 'user@example.com'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Phone</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="var(--color-accent-green)" />
                {user?.phone || '+91 98765 43210'}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/dashboard')}>
            Start Exploring <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: step === 'email' ? 'rgba(78, 168, 222, 0.15)' : 'rgba(46, 204, 113, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {step === 'email'
            ? <Mail size={28} color="var(--color-accent-blue)" />
            : <Phone size={28} color="var(--color-accent-green)" />
          }
        </div>

        <h2>Verify Your {step === 'email' ? 'Email' : 'Phone'}</h2>
        <p className="auth-subtitle">
          We've sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            {step === 'email' ? (user?.email || 'your email') : (user?.phone || 'your phone')}
          </strong>
        </p>

        {/* Step badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <span className={`badge ${step === 'email' || step === 'phone' ? 'badge-info' : 'badge-success'}`}>
            {user?.emailVerified ? '✓ Email' : '1. Email'}
          </span>
          <span className={`badge ${step === 'phone' ? 'badge-info' : step === 'done' ? 'badge-success' : 'badge-purple'}`}>
            {user?.phoneVerified ? '✓ Phone' : '2. Phone'}
          </span>
        </div>

        {/* OTP Input */}
        <div className="otp-input-group">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              className="otp-input"
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
          💡 For demo: Enter any 6 digits (e.g., 123456)
        </p>

        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handleVerify}
          disabled={isVerifying}
          style={{ marginTop: 16 }}
        >
          {isVerifying ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Verify Code'}
        </button>

        <div style={{ marginTop: 16, fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
          {timer > 0 ? (
            <span>Resend code in <strong style={{ color: 'var(--color-accent-teal-light)' }}>{timer}s</strong></span>
          ) : (
            <button onClick={handleResend} style={{
              background: 'none', border: 'none', color: 'var(--color-accent-teal-light)',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
            }}>
              Resend Code
            </button>
          )}
        </div>

        <button className="btn btn-ghost" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
