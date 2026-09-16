import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Navigation, MapPin, Clock, Car, Phone, MessageSquare,
  Star, Shield, ChevronRight, Share2, AlertTriangle,
  User, Zap, CheckCircle, Circle, Radio
} from 'lucide-react';
import { useVehicleStore, useBookingStore, useAuthStore } from '../store';

// ── Vehicle type emoji map ────────────────────────────────────────────────────
const VEHICLE_EMOJI = {
  'Auto 3-Wheeler': '🛺',
  'E-Rickshaw':     '⚡🛺',
  'Hatchback':      '🚗',
  'Sedan':          '🚕',
  'SUV':            '🚙',
  'Mini Bus 20-25': '🚐',
  'Mini Bus 26-40': '🚌',
};

// ── Fake city coords for demo routes ─────────────────────────────────────────
const CITY_COORDS = {
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Pune:      { lat: 18.5204, lng: 73.8567 },
  Delhi:     { lat: 28.6139, lng: 77.2090 },
  Jaipur:    { lat: 26.9124, lng: 75.7873 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Goa:       { lat: 15.2993, lng: 74.1240 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
};

function lerp(a, b, t) { return a + (b - a) * t; }

// ── Animated Map Placeholder (no API key needed) ──────────────────────────────
function AnimatedMapView({ fromCity, toCity, driverLat, driverLng, progress }) {
  const canvasRef = useRef(null);
  const origin = CITY_COORDS[fromCity] || { lat: 19.076, lng: 72.877 };
  const dest   = CITY_COORDS[toCity]   || { lat: 18.520, lng: 73.856 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Helper to convert lat/lng to canvas pixels
    const lats = [origin.lat, dest.lat, driverLat];
    const lngs = [origin.lng, dest.lng, driverLng];
    const minLat = Math.min(...lats) - 0.5;
    const maxLat = Math.max(...lats) + 0.5;
    const minLng = Math.min(...lngs) - 0.5;
    const maxLng = Math.max(...lngs) + 0.5;

    const toX = (lng) => ((lng - minLng) / (maxLng - minLng)) * (W - 60) + 30;
    const toY = (lat) => H - (((lat - minLat) / (maxLat - minLat)) * (H - 60) + 30);

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d1117');
    bg.addColorStop(1, '#161b22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }

    const ox = toX(origin.lng), oy = toY(origin.lat);
    const dx = toX(dest.lng),   dy = toY(dest.lat);
    const drx = toX(driverLng), dry = toY(driverLat);

    // Dashed route line
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(27,153,139,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(dx, dy); ctx.stroke();
    ctx.setLineDash([]);

    // Completed route segment
    ctx.strokeStyle = '#1b998b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#1b998b';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(drx, dry); ctx.stroke();
    ctx.shadowBlur = 0;

    // Origin pin
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1b998b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A', ox, oy + 4);

    // Destination pin
    ctx.beginPath();
    ctx.arc(dx, dy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e84393';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('B', dx, dy + 4);

    // Driver marker (pulsing circle effect done via CSS animation on overlay)
    ctx.beginPath();
    ctx.arc(drx, dry, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,0,0.15)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(drx, dry, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffc800';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚗', drx, dry + 4);

    // City labels
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fromCity, ox, oy - 16);
    ctx.fillText(toCity, dx, dy - 16);
  }, [driverLat, driverLng, fromCity, toCity]);

  return (
    <canvas
      ref={canvasRef}
      width={680}
      height={360}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    'In Transit':  { color: '#1b998b', bg: 'rgba(27,153,139,0.12)', icon: <Radio size={12} /> },
    'At Pickup':   { color: '#ffc800', bg: 'rgba(255,200,0,0.12)',  icon: <MapPin size={12} /> },
    'Completed':   { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: <CheckCircle size={12} /> },
    'Delayed':     { color: '#f97316', bg: 'rgba(249,115,22,0.12)',icon: <AlertTriangle size={12} /> },
  }[status] || { color: '#888', bg: 'rgba(128,128,128,0.12)', icon: <Circle size={12} /> };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999,
      background: config.bg, color: config.color,
      fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em',
    }}>
      {config.icon} {status}
    </span>
  );
}

// ── Timeline step ─────────────────────────────────────────────────────────────
function TimelineStep({ icon, label, time, status }) {
  const colors = { done: '#1b998b', active: '#ffc800', pending: '#444' };
  const col = colors[status] || '#444';
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: status === 'done' ? col : status === 'active' ? 'rgba(255,200,0,0.15)' : 'rgba(255,255,255,0.05)',
        border: `2px solid ${col}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: col, boxShadow: status === 'active' ? `0 0 12px ${col}55` : 'none',
      }}>
        {icon}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: status === 'pending' ? '#666' : 'var(--color-text)' }}>
          {label}
        </div>
        {time && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            {time}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveTrackingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { vehicles } = useVehicleStore();
  const { bookings } = useBookingStore();
  const { user } = useAuthStore();

  // Find booking if ID provided, otherwise pick first active vehicle
  const booking = bookings?.find(b => b.id === bookingId) || bookings?.[0];
  const vehicle = vehicles.find(v => v.id === (booking?.vehicleId || vehicles[0]?.id)) || vehicles[0];

  const fromCity = booking?.from || vehicle?.journeyHistory?.[0]?.from || 'Mumbai';
  const toCity   = booking?.to   || vehicle?.journeyHistory?.[0]?.to   || 'Pune';

  const origin = CITY_COORDS[fromCity] || { lat: 19.076, lng: 72.877 };
  const dest   = CITY_COORDS[toCity]   || { lat: 18.520, lng: 73.856 };

  // Driver position state — starts near origin, moves toward dest
  const [progress, setProgress]       = useState(0.12);
  const [tripStatus, setTripStatus]   = useState('In Transit');
  const [etaMinutes, setEtaMinutes]   = useState(42);
  const [speed, setSpeed]             = useState(54);
  const [shareMsg, setShareMsg]       = useState('');

  const driverLat = lerp(origin.lat, dest.lat, progress);
  const driverLng = lerp(origin.lng, dest.lng, progress);

  // Simulate movement every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 1) { setTripStatus('Completed'); return 1; }
        const next = Math.min(1, p + 0.012 + Math.random() * 0.008);
        setEtaMinutes(Math.max(0, Math.round((1 - next) * 55)));
        setSpeed(Math.floor(45 + Math.random() * 40));
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  const progressPercent = Math.round(progress * 100);

  const steps = [
    { icon: <MapPin size={14} />, label: fromCity, time: 'Departed 08:00 AM', status: 'done' },
    { icon: <Navigation size={14} />, label: 'En Route', time: `${progressPercent}% of journey • ${etaMinutes} min left`, status: progress >= 1 ? 'done' : 'active' },
    { icon: <CheckCircle size={14} />, label: toCity, time: progress >= 1 ? 'Arrived!' : `ETA: ~${etaMinutes} min`, status: progress >= 1 ? 'done' : 'pending' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>🗺️ Live Tracking</h1>
          <p>{fromCity} → {toCity} &nbsp;·&nbsp; Real-time driver location</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={tripStatus} />
          <button className="btn" onClick={handleShare} style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-full)'
          }}>
            <Share2 size={14} /> {shareMsg || 'Share Trip'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}
           className="tracking-grid">

        {/* ── Map ── */}
        <div>
          <div style={{
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: '#0d1117', marginBottom: 16,
            position: 'relative',
            height: 360,
          }}>
            <AnimatedMapView
              fromCity={fromCity} toCity={toCity}
              driverLat={driverLat} driverLng={driverLng}
              progress={progress}
            />
            {/* Live badge */}
            <div style={{
              position: 'absolute', top: 14, left: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              borderRadius: 999, padding: '6px 14px',
              border: '1px solid rgba(27,153,139,0.4)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#1b998b', boxShadow: '0 0 6px #1b998b',
                animation: 'pulse 1.5s infinite',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>LIVE</span>
            </div>
            {/* Speed badge */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              borderRadius: 999, padding: '6px 14px',
              border: '1px solid rgba(255,200,0,0.3)',
              color: '#ffc800', fontSize: '0.75rem', fontWeight: 700,
            }}>
              <Zap size={12} /> {speed} km/h
            </div>
          </div>

          {/* Progress bar */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.06em' }}>
                JOURNEY PROGRESS
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent-teal-light)' }}>
                {progressPercent}%
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--color-surface)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #1b998b, #17d9c9)',
                boxShadow: '0 0 12px rgba(27,153,139,0.6)',
                transition: 'width 3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              <span>📍 {fromCity}</span>
              <span>🏁 {toCity}</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ETA Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(27,153,139,0.15), rgba(23,217,201,0.08))',
            border: '1px solid rgba(27,153,139,0.3)',
            borderRadius: 'var(--radius-lg)', padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', marginBottom: 4 }}>
              ESTIMATED ARRIVAL
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent-teal-light)', lineHeight: 1 }}>
              {progress >= 1 ? '🎉' : `${etaMinutes}`}
              {progress < 1 && <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: 4 }}>min</span>}
            </div>
            {progress >= 1 && (
              <div style={{ marginTop: 6, color: '#22c55e', fontWeight: 700 }}>You have arrived!</div>
            )}
          </div>

          {/* Driver Info */}
          <div className="glass-card">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.06em', marginBottom: 14 }}>
              DRIVER & VEHICLE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(27,153,139,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
              }}>
                {VEHICLE_EMOJI[vehicle?.type] || '🚗'}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{vehicle?.ownerName || 'Driver'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {vehicle?.type} · {vehicle?.registrationNumber}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11} fill={i <= 4 ? '#ffc800' : 'none'} color="#ffc800" />
                  ))}
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginLeft: 2 }}>4.8</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Current Speed', `${speed} km/h`],
                ['Coordinates', `${driverLat.toFixed(4)}, ${driverLng.toFixed(4)}`],
                ['Last Updated', 'Just now'],
                ['Seats', `${vehicle?.seatingCapacity || 4} capacity`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px' }}>
                <Phone size={14} /> Call
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px' }}>
                <MessageSquare size={14} /> Chat
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.06em', marginBottom: 16 }}>
              TRIP TIMELINE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {steps.map((s, i) => (
                <div key={i}>
                  <TimelineStep {...s} />
                  {i < steps.length - 1 && (
                    <div style={{
                      width: 2, height: 20, marginLeft: 15, marginTop: 4,
                      background: s.status === 'done' ? '#1b998b' : 'rgba(255,255,255,0.08)',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Safety info */}
          <div style={{
            display: 'flex', gap: 10, padding: '12px 14px',
            background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <Shield size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.78rem', color: '#22c55e', lineHeight: 1.5 }}>
              <strong>Trip Insured.</strong> Your ride is covered under YatraGo's safety policy.
            </div>
          </div>

          {progress >= 1 && (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/my-bookings')}>
              Rate this trip <Star size={14} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .tracking-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
