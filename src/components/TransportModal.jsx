import React, { useState, useEffect } from 'react';
import {
  X, Plane, TrainFront, Bell, CheckCircle2,
  Ticket, Shield, Zap, LayoutGrid, MapPin, Clock, Wifi, Star
} from 'lucide-react';
import { useTransportModalStore, useToastStore, useAuthStore } from '../store';
import { supabase } from '../supabaseClient';

/* ─── per-type config ─── */
const config = {
  flights: {
    icon: Plane,
    ringClass: 'transport-ring-purple',
    badgeClass: 'transport-badge-purple',
    btnClass: 'transport-btn-purple',
    glowClass: 'transport-glow-purple',
    accent: '#a855f7',
    accentLight: '#c084fc',
    label: 'Flights',
    headline: '✈️ Flight Booking Coming Soon',
    sub: 'Domestic flight booking across India is coming soon! We\'re working on integrating top airlines.',
    features: [
      { icon: Ticket,     label: 'Easy Bookings' },
      { icon: Star,       label: 'Best Fares' },
      { icon: Shield,     label: 'Secure Payments' },
      { icon: Wifi,       label: 'Live Flight Status' },
    ],
  },
  trains: {
    icon: TrainFront,
    ringClass: 'transport-ring-teal',
    badgeClass: 'transport-badge-teal',
    btnClass: 'transport-btn-teal',
    glowClass: 'transport-glow-teal',
    accent: '#14b8a6',
    accentLight: '#2dd4bf',
    label: 'Trains',
    headline: '🚂 Train Booking Coming Soon',
    sub: 'Book train tickets across India via IRCTC — coming soon! Seat layouts, PNR status & more.',
    features: [
      { icon: Ticket,     label: 'Easy Bookings' },
      { icon: LayoutGrid, label: 'Instant Seat Layouts' },
      { icon: Clock,      label: 'Live PNR Status' },
      { icon: Shield,     label: 'Secure & Reliable' },
    ],
  },
};

export default function TransportModal() {
  const { activeModal, closeModal } = useTransportModalStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const cfg = config[activeModal] || config.flights;
  const IconCmp = cfg.icon;

  useEffect(() => {
    setNotified(false);
    if (!activeModal || !user?.id) return;
    supabase
      .from('feature_interest')
      .select('id')
      .eq('user_id', String(user.id))
      .eq('feature_name', activeModal)
      .maybeSingle()
      .then(({ data }) => { if (data) setNotified(true); });
  }, [activeModal, user?.id]);

  if (!activeModal) return null;

  const handleNotify = async () => {
    if (notified || loading) return;
    setLoading(true);
    await supabase.from('feature_interest').insert({
      user_id: String(user?.id || 'guest'),
      feature_name: activeModal,
      subscribed_at: new Date().toISOString(),
    }).catch(e => console.warn('feature_interest insert error:', e));
    addToast(`We'll notify you when ${cfg.label} launches! 🎉`, 'success');
    setNotified(true);
    setLoading(false);
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={closeModal}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 450,
        }}
        className="animate-fade-in"
      />

      {/* ── Card ── */}
      <div
        className={`transport-modal-card animate-fade-in ${cfg.glowClass}`}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 451,
          width: '92%',
          maxWidth: '460px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button onClick={closeModal} className="transport-close-btn" title="Close">
          <X size={18} />
        </button>

        {/* ── Icon ring ── */}
        <div className="transport-icon-wrap">
          <div className={`transport-icon-ring ${cfg.ringClass}`}>
            <div className="transport-icon-inner">
              <IconCmp size={38} strokeWidth={1.8} />
            </div>
            {/* animated pulse ring */}
            <div className={`transport-pulse-ring ${cfg.ringClass}`} />
          </div>
        </div>

        {/* ── COMING SOON badge ── */}
        <div className="transport-badge-row">
          <span className={`transport-badge ${cfg.badgeClass}`}>
            <span className="transport-badge-dot" />
            COMING SOON
          </span>
        </div>

        {/* ── Headline ── */}
        <h2 className="transport-headline">{cfg.headline}</h2>

        {/* ── Description ── */}
        <p className="transport-desc">{cfg.sub}</p>

        {/* ── Feature grid ── */}
        <div className="transport-features-grid">
          {cfg.features.map(({ icon: Ic, label }) => (
            <div key={label} className="transport-feature-item">
              <div className={`transport-feature-icon ${cfg.ringClass}`}>
                <Ic size={18} strokeWidth={1.8} />
              </div>
              <span className="transport-feature-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Notify Me button ── */}
        <button
          onClick={handleNotify}
          disabled={notified || loading}
          className={`transport-notify-btn ${
            notified
              ? 'transport-notify-done'
              : loading
                ? `transport-notify-saving ${cfg.btnClass}`
                : cfg.btnClass
          }`}
        >
          {notified ? (
            <>
              <CheckCircle2 size={20} />
              <span>Notified ✓</span>
            </>
          ) : (
            <>
              <Bell size={18} />
              <span>{loading ? 'Saving…' : 'Notify Me When Live'}</span>
            </>
          )}
        </button>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        .transport-modal-card {
          background: linear-gradient(145deg, #0d1b3e 0%, #070f22 60%, #0a0f1e 100%);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 28px;
          padding: 36px 28px 28px;
          box-shadow: 0 32px 64px -12px rgba(0,0,0,0.9);
          text-align: center;
        }

        /* Glow variants */
        .transport-glow-purple { box-shadow: 0 32px 64px -12px rgba(0,0,0,0.9), 0 0 60px rgba(168,85,247,0.18); }
        .transport-glow-teal   { box-shadow: 0 32px 64px -12px rgba(0,0,0,0.9), 0 0 60px rgba(20,184,166,0.18); }

        /* Close button */
        .transport-close-btn {
          position: absolute; top: 16px; right: 16px;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.55);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .transport-close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

        /* Icon ring */
        .transport-icon-wrap {
          display: flex; justify-content: center;
          margin-bottom: 24px;
        }
        .transport-icon-ring {
          position: relative;
          width: 96px; height: 96px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .transport-ring-purple {
          background: radial-gradient(circle at 40% 40%, rgba(168,85,247,0.25), rgba(168,85,247,0.05));
          border: 2.5px solid rgba(168,85,247,0.55);
          color: #c084fc;
        }
        .transport-ring-teal {
          background: radial-gradient(circle at 40% 40%, rgba(20,184,166,0.25), rgba(20,184,166,0.05));
          border: 2.5px solid rgba(20,184,166,0.55);
          color: #2dd4bf;
        }
        .transport-icon-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%;
        }
        /* Pulse ring */
        .transport-pulse-ring {
          position: absolute; inset: -10px;
          border-radius: 50%;
          opacity: 0;
          animation: transport-pulse 2.4s ease-out infinite;
        }
        .transport-pulse-ring.transport-ring-purple { border: 2px solid rgba(168,85,247,0.4); }
        .transport-pulse-ring.transport-ring-teal   { border: 2px solid rgba(20,184,166,0.4); }
        @keyframes transport-pulse {
          0%   { transform: scale(0.88); opacity: 0.7; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        /* Badge */
        .transport-badge-row { margin-bottom: 14px; }
        .transport-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .transport-badge-purple {
          background: rgba(168,85,247,0.12);
          border: 1px solid rgba(168,85,247,0.35);
          color: #c084fc;
        }
        .transport-badge-teal {
          background: rgba(20,184,166,0.12);
          border: 1px solid rgba(20,184,166,0.35);
          color: #2dd4bf;
        }
        .transport-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          animation: transport-blink 1.5s ease-in-out infinite;
        }
        .transport-badge-purple .transport-badge-dot { background: #c084fc; }
        .transport-badge-teal   .transport-badge-dot { background: #2dd4bf; }
        @keyframes transport-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        /* Headline */
        .transport-headline {
          font-size: 1.45rem;
          font-weight: 900;
          color: #fff;
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin-bottom: 12px;
        }

        /* Description */
        .transport-desc {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.62);
          line-height: 1.65;
          margin-bottom: 26px;
          max-width: 340px;
          margin-left: auto; margin-right: auto;
        }

        /* Feature grid */
        .transport-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 26px;
        }
        .transport-feature-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background 0.2s;
          text-align: left;
        }
        .transport-feature-item:hover { background: rgba(255,255,255,0.07); }
        .transport-feature-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .transport-feature-icon.transport-ring-purple {
          background: rgba(168,85,247,0.15);
          border: 1px solid rgba(168,85,247,0.3);
          color: #c084fc;
        }
        .transport-feature-icon.transport-ring-teal {
          background: rgba(20,184,166,0.15);
          border: 1px solid rgba(20,184,166,0.3);
          color: #2dd4bf;
        }
        .transport-feature-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          line-height: 1.2;
        }

        /* Notify Me button */
        .transport-notify-btn {
          width: 100%;
          padding: 15px 24px;
          border-radius: 18px;
          font-size: 1rem;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          border: none; cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s, filter 0.18s, opacity 0.3s;
          margin-bottom: 4px;
          letter-spacing: 0.01em;
        }
        .transport-notify-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.015);
          filter: brightness(1.1);
        }
        .transport-notify-btn:active:not(:disabled) { transform: scale(0.985); }
        .transport-btn-purple {
          background: linear-gradient(135deg, #9333ea, #a855f7, #c084fc);
          color: #fff;
          box-shadow: 0 8px 24px rgba(168,85,247,0.35);
        }
        .transport-btn-teal {
          background: linear-gradient(135deg, #0d9488, #14b8a6, #2dd4bf);
          color: #fff;
          box-shadow: 0 8px 24px rgba(20,184,166,0.35);
        }
        /* Faded state while saving */
        .transport-notify-saving {
          opacity: 0.45;
          filter: saturate(0.5);
          cursor: not-allowed;
          box-shadow: none !important;
        }
        /* Faded done state — clearly already pressed */
        .transport-notify-done {
          opacity: 0.45;
          filter: grayscale(0.4) saturate(0.6);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.55);
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </>
  );
}
