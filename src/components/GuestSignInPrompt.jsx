/**
 * GuestSignInPrompt — shown in place of personal-only pages for unauthenticated users.
 * Renders a friendly card with Sign In / Sign Up buttons.
 * Does NOT redirect or navigate — user stays on the current URL.
 */
import { Lock } from 'lucide-react';
import { useGuestLoginModalStore } from '../store';

const PAGE_ICONS = {
  Wallet:    '💰',
  Bookings:  '🎫',
  Profile:   '👤',
  Devices:   '📱',
  Support:   '🎧',
};

export default function GuestSignInPrompt({ label = 'this page' }) {
  const { openModal } = useGuestLoginModalStore();
  const icon = PAGE_ICONS[label] || '🔒';

  return (
    <div className="animate-fade-in" style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      <div style={{
        maxWidth: 420, width: '100%', textAlign: 'center',
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: '48px 36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(27,153,139,0.12)', border: '2px solid rgba(27,153,139,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
        }}>
          {icon}
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(27,153,139,0.15)', border: '1.5px solid var(--color-accent-teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '-20px auto 20px', position: 'relative',
        }}>
          <Lock size={14} color="var(--color-accent-teal-light)" />
        </div>

        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 10 }}>
          Sign in to view your {label}
        </h2>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.6 }}>
          Your {label.toLowerCase()} is personal — create a free account or sign in to access it.
          Everything else on YatraGo is available to browse without an account.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id={`guest-signin-${label.toLowerCase()}`}
            className="btn btn-primary btn-lg"
            style={{ minWidth: 130 }}
            onClick={() => openModal('signin')}
          >
            Sign In
          </button>
          <button
            id={`guest-signup-${label.toLowerCase()}`}
            className="btn btn-secondary btn-lg"
            style={{ minWidth: 130 }}
            onClick={() => openModal('signup')}
          >
            Create Account
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          No credit card required to sign up.
        </p>
      </div>
    </div>
  );
}
