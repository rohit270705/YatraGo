import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrainFront, MapPin, ArrowRight, Clock, Search, SlidersHorizontal,
  X, ChevronDown, ChevronUp, Users
} from 'lucide-react';

// ── Class metadata ─────────────────────────────────────────────────────────────
export const TRAIN_CLASS_META = {
  GN: { label: 'General (Unreserved)', icon: '🪑', hasBerths: false, isAC: false },
  SL: { label: 'Sleeper',             icon: '🛏️', hasBerths: true,  isAC: false },
  '3A': { label: 'AC 3 Tier',         icon: '❄️', hasBerths: true,  isAC: true  },
  '3E': { label: 'AC 3 Economy',      icon: '❄️', hasBerths: true,  isAC: true  },
  '2A': { label: 'AC 2 Tier',         icon: '🌬️', hasBerths: true,  isAC: true  },
  '1A': { label: 'AC First Class',    icon: '👑', hasBerths: true,  isAC: true  },
  CC:   { label: 'AC Chair Car',      icon: '💺', hasBerths: false, isAC: true  },
  EC:   { label: 'Executive Chair',   icon: '🎩', hasBerths: false, isAC: true  },
};

// ── Seed data — train listings (one row per train) ────────────────────────────
// Removed: single travelClass / price fields (now on class options)
const TRAIN_LISTINGS = [
  { id: 'tr-01', trainNumber: '12123', operator: 'Deccan Queen',       from: 'Mumbai',    to: 'Pune',       depart: '07:15', arrive: '10:25', duration: '3h 10m',  mode: 'train' },
  { id: 'tr-02', trainNumber: '12015', operator: 'Ajmer Shatabdi',     from: 'Delhi',     to: 'Jaipur',     depart: '06:05', arrive: '10:40', duration: '4h 35m',  mode: 'train' },
  { id: 'tr-03', trainNumber: '12902', operator: 'Gujarat Mail',       from: 'Mumbai',    to: 'Ahmedabad',  depart: '21:25', arrive: '05:10', duration: '7h 45m',  mode: 'train' },
  { id: 'tr-04', trainNumber: '12229', operator: 'Lucknow Mail',       from: 'Delhi',     to: 'Lucknow',    depart: '22:00', arrive: '06:35', duration: '8h 35m',  mode: 'train' },
  { id: 'tr-05', trainNumber: '12007', operator: 'Shatabdi Express',   from: 'Chennai',   to: 'Bangalore',  depart: '06:00', arrive: '10:30', duration: '4h 30m',  mode: 'train' },
  { id: 'tr-06', trainNumber: '10103', operator: 'Mandovi Express',    from: 'Mumbai',    to: 'Goa',        depart: '07:10', arrive: '16:45', duration: '9h 35m',  mode: 'train' },
  { id: 'tr-07', trainNumber: '12903', operator: 'Golden Temple Mail', from: 'Delhi',     to: 'Amritsar',   depart: '21:35', arrive: '05:50', duration: '8h 15m',  mode: 'train' },
  { id: 'tr-08', trainNumber: '12301', operator: 'Rajdhani Express',   from: 'Kolkata',   to: 'Delhi',      depart: '16:50', arrive: '10:00', duration: '17h 10m', mode: 'train' },
  { id: 'tr-09', trainNumber: '22691', operator: 'Rajdhani Express',   from: 'Bangalore', to: 'Hyderabad',  depart: '20:00', arrive: '06:30', duration: '10h 30m', mode: 'train' },
  { id: 'tr-10', trainNumber: '12951', operator: 'Mumbai Rajdhani',    from: 'Mumbai',    to: 'Delhi',      depart: '17:00', arrive: '08:35', duration: '15h 35m', mode: 'train' },
  { id: 'tr-11', trainNumber: '11302', operator: 'Udyan Express',      from: 'Pune',      to: 'Bangalore',  depart: '20:30', arrive: '12:15', duration: '15h 45m', mode: 'train' },
  { id: 'tr-12', trainNumber: '12005', operator: 'Shatabdi Express',   from: 'Delhi',     to: 'Chandigarh', depart: '07:20', arrive: '10:40', duration: '3h 20m',  mode: 'train' },
];

// ── Seed data — class options (one row per train × class) ─────────────────────
// Realistic: Rajdhani = 3A/2A/1A; Shatabdi = CC/EC; Mail/Express = GN/SL/3A/2A
const TRAIN_CLASS_OPTIONS = [
  // Deccan Queen (tr-01) — day express, GN + SL + CC
  { id: 'tco-01-GN', trainListingId: 'tr-01', classCode: 'GN', price: 85,   seatsLeft: 120, status: 'Available' },
  { id: 'tco-01-SL', trainListingId: 'tr-01', classCode: 'SL', price: 145,  seatsLeft: 42,  status: 'Available' },
  { id: 'tco-01-CC', trainListingId: 'tr-01', classCode: 'CC', price: 430,  seatsLeft: 18,  status: 'Available' },

  // Ajmer Shatabdi (tr-02) — chair-car only
  { id: 'tco-02-CC', trainListingId: 'tr-02', classCode: 'CC', price: 685,  seatsLeft: 35,  status: 'Available' },
  { id: 'tco-02-EC', trainListingId: 'tr-02', classCode: 'EC', price: 1350, seatsLeft: 6,   status: 'Available' },

  // Gujarat Mail (tr-03) — SL to 1A
  { id: 'tco-03-SL', trainListingId: 'tr-03', classCode: 'SL', price: 275,  seatsLeft: 58,  status: 'Available' },
  { id: 'tco-03-3A', trainListingId: 'tr-03', classCode: '3A', price: 775,  seatsLeft: 31,  status: 'Available' },
  { id: 'tco-03-2A', trainListingId: 'tr-03', classCode: '2A', price: 1150, seatsLeft: 11,  status: 'Available' },
  { id: 'tco-03-1A', trainListingId: 'tr-03', classCode: '1A', price: 1940, seatsLeft: 2,   status: 'RAC'       },

  // Lucknow Mail (tr-04) — GN + SL + 3A
  { id: 'tco-04-GN', trainListingId: 'tr-04', classCode: 'GN', price: 95,   seatsLeft: 200, status: 'Available' },
  { id: 'tco-04-SL', trainListingId: 'tr-04', classCode: 'SL', price: 320,  seatsLeft: 44,  status: 'Available' },
  { id: 'tco-04-3A', trainListingId: 'tr-04', classCode: '3A', price: 870,  seatsLeft: 0,   status: 'Waitlist'  },

  // Shatabdi Chennai (tr-05) — chair-car only
  { id: 'tco-05-CC', trainListingId: 'tr-05', classCode: 'CC', price: 695,  seatsLeft: 35,  status: 'Available' },
  { id: 'tco-05-EC', trainListingId: 'tr-05', classCode: 'EC', price: 1380, seatsLeft: 8,   status: 'Available' },

  // Mandovi Express (tr-06) — SL + 2A + 3A
  { id: 'tco-06-SL', trainListingId: 'tr-06', classCode: 'SL', price: 480,  seatsLeft: 30,  status: 'Available' },
  { id: 'tco-06-3A', trainListingId: 'tr-06', classCode: '3A', price: 920,  seatsLeft: 12,  status: 'Available' },
  { id: 'tco-06-2A', trainListingId: 'tr-06', classCode: '2A', price: 1150, seatsLeft: 5,   status: 'RAC'       },

  // Golden Temple Mail (tr-07) — GN to 2A
  { id: 'tco-07-GN', trainListingId: 'tr-07', classCode: 'GN', price: 120,  seatsLeft: 200, status: 'Available' },
  { id: 'tco-07-SL', trainListingId: 'tr-07', classCode: 'SL', price: 290,  seatsLeft: 61,  status: 'Available' },
  { id: 'tco-07-3A', trainListingId: 'tr-07', classCode: '3A', price: 920,  seatsLeft: 14,  status: 'Available' },
  { id: 'tco-07-2A', trainListingId: 'tr-07', classCode: '2A', price: 1340, seatsLeft: 4,   status: 'RAC'       },

  // Rajdhani Kolkata (tr-08) — AC-only flagship
  { id: 'tco-08-3A', trainListingId: 'tr-08', classCode: '3A', price: 1620, seatsLeft: 22,  status: 'Available' },
  { id: 'tco-08-2A', trainListingId: 'tr-08', classCode: '2A', price: 2280, seatsLeft: 9,   status: 'Available' },
  { id: 'tco-08-1A', trainListingId: 'tr-08', classCode: '1A', price: 3840, seatsLeft: 3,   status: 'RAC'       },

  // Rajdhani Bangalore (tr-09) — 3A + 2A + 1A
  { id: 'tco-09-3A', trainListingId: 'tr-09', classCode: '3A', price: 1320, seatsLeft: 18,  status: 'Available' },
  { id: 'tco-09-2A', trainListingId: 'tr-09', classCode: '2A', price: 1860, seatsLeft: 7,   status: 'Available' },
  { id: 'tco-09-1A', trainListingId: 'tr-09', classCode: '1A', price: 3150, seatsLeft: 2,   status: 'RAC'       },

  // Mumbai Rajdhani (tr-10) — 3A + 2A + 1A
  { id: 'tco-10-3A', trainListingId: 'tr-10', classCode: '3A', price: 1490, seatsLeft: 0,   status: 'Waitlist'  },
  { id: 'tco-10-2A', trainListingId: 'tr-10', classCode: '2A', price: 2090, seatsLeft: 6,   status: 'RAC'       },
  { id: 'tco-10-1A', trainListingId: 'tr-10', classCode: '1A', price: 3520, seatsLeft: 1,   status: 'Available' },

  // Udyan Express (tr-11) — GN + SL + 3A
  { id: 'tco-11-GN', trainListingId: 'tr-11', classCode: 'GN', price: 110,  seatsLeft: 180, status: 'Available' },
  { id: 'tco-11-SL', trainListingId: 'tr-11', classCode: 'SL', price: 480,  seatsLeft: 55,  status: 'Available' },
  { id: 'tco-11-3A', trainListingId: 'tr-11', classCode: '3A', price: 1180, seatsLeft: 8,   status: 'Available' },

  // Shatabdi Delhi–Chandigarh (tr-12) — CC + EC
  { id: 'tco-12-CC', trainListingId: 'tr-12', classCode: 'CC', price: 640,  seatsLeft: 28,  status: 'Available' },
  { id: 'tco-12-EC', trainListingId: 'tr-12', classCode: 'EC', price: 1280, seatsLeft: 5,   status: 'Available' },
];

// ── Class filter chips (all real IR codes) ─────────────────────────────────────
const CLASS_FILTERS = [
  { id: 'all', label: 'All Classes', icon: '🚂' },
  { id: 'GN',  label: 'GN — General',     icon: '🪑' },
  { id: 'SL',  label: 'SL — Sleeper',     icon: '🛏️' },
  { id: '3A',  label: '3A — AC 3 Tier',   icon: '❄️' },
  { id: '3E',  label: '3E — AC 3 Eco',    icon: '❄️' },
  { id: '2A',  label: '2A — AC 2 Tier',   icon: '🌬️' },
  { id: '1A',  label: '1A — AC First',    icon: '👑' },
  { id: 'CC',  label: 'CC — Chair Car',   icon: '💺' },
  { id: 'EC',  label: 'EC — Exec Chair',  icon: '🎩' },
];

function statusBadge(s) {
  if (s === 'Available') return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: s };
  if (s === 'RAC')       return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'RAC' };
  return                        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Waitlist' };
}

const CITIES = ['Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Jaipur',
                'Ahmedabad', 'Lucknow', 'Amritsar', 'Chandigarh', 'Goa'];

// ── ClassPickerRow — shown inline when a train card is expanded ───────────────
function ClassPickerRow({ classOpt, onSelect }) {
  const meta   = TRAIN_CLASS_META[classOpt.classCode] || {};
  const badge  = statusBadge(classOpt.status);
  const isBook = classOpt.status !== 'Waitlist';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      marginTop: 6, flexWrap: 'wrap', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--color-accent-teal-light)', fontFamily: 'monospace' }}>
              {classOpt.classCode}
            </span>
            {' '}— {meta.label}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: 8, marginTop: 2 }}>
            <span style={{ background: badge.bg, color: badge.color, padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>
              {badge.label}
            </span>
            {classOpt.seatsLeft > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Users size={10} /> {classOpt.seatsLeft} seats
              </span>
            )}
            {meta.isAC && (
              <span style={{ color: '#60a5fa', fontWeight: 600 }}>AC</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
          ₹{classOpt.price.toLocaleString('en-IN')}
        </span>
        <button
          className={`btn btn-sm ${isBook ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.8rem', opacity: isBook ? 1 : 0.6 }}
          onClick={() => onSelect(classOpt)}
          disabled={!isBook}
          title={!isBook ? 'Waitlisted — no guaranteed seat' : ''}
        >
          {isBook ? 'Select →' : 'Waitlisted'}
        </button>
      </div>
    </div>
  );
}

export default function TrainsPage() {
  const navigate = useNavigate();
  const [from,        setFrom]        = useState('');
  const [to,          setTo]          = useState('');
  const [date,        setDate]        = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy,      setSortBy]      = useState('price');
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedId,  setExpandedId]  = useState(null); // which train card is expanded

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    setExpandedId(null);
  };

  // Build a map: trainId → [class options]
  const classMap = useMemo(() => {
    const m = {};
    TRAIN_CLASS_OPTIONS.forEach(co => {
      if (!m[co.trainListingId]) m[co.trainListingId] = [];
      m[co.trainListingId].push(co);
    });
    return m;
  }, []);

  // Filter train listings
  const displayed = useMemo(() => {
    let base = TRAIN_LISTINGS;

    if (hasSearched) {
      if (from.trim()) base = base.filter(t => t.from.toLowerCase().includes(from.trim().toLowerCase()));
      if (to.trim())   base = base.filter(t => t.to.toLowerCase().includes(to.trim().toLowerCase()));
    }

    // Class filter: keep trains that have at least one option matching classFilter
    if (classFilter !== 'all') {
      base = base.filter(t => (classMap[t.id] || []).some(co => co.classCode === classFilter));
    }

    // Derive minimum available price per train for sorting
    const withMinPrice = base.map(t => {
      const opts = classMap[t.id] || [];
      const availOpts = opts.filter(o => o.status !== 'Waitlist');
      const minPrice  = availOpts.length ? Math.min(...availOpts.map(o => o.price)) : Infinity;
      return { ...t, _minPrice: minPrice };
    });

    const sorted = [...withMinPrice];
    if (sortBy === 'price')      sorted.sort((a, b) => a._minPrice - b._minPrice);
    if (sortBy === 'price-high') sorted.sort((a, b) => b._minPrice - a._minPrice);
    if (sortBy === 'depart')     sorted.sort((a, b) => a.depart.localeCompare(b.depart));
    return sorted;
  }, [from, to, classFilter, sortBy, hasSearched, classMap]);

  const handleSelectClass = (train, classOpt) => {
    const meta = TRAIN_CLASS_META[classOpt.classCode] || {};
    navigate('/booking', {
      state: {
        transitListing: {
          ...train,
          // class-level fields merged onto listing
          classCode:   classOpt.classCode,
          classLabel:  meta.label,
          travelClass: `${classOpt.classCode} — ${meta.label}`,
          price:       classOpt.price,
          seatsLeft:   classOpt.seatsLeft,
          status:      classOpt.status,
          isAC:        meta.isAC,
          hasBerths:   meta.hasBerths,
        },
        mode: 'train',
      },
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🚂 Trains</h1>
        <p>India's rail network — search, pick your class, book</p>
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">From</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Origin city" value={from} onChange={e => setFrom(e.target.value)} list="tr-cities-from" />
                <datalist id="tr-cities-from">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface)', flexShrink: 0, alignSelf: 'center', marginTop: 16 }}>
              <ArrowRight size={18} color="var(--color-accent-teal-light)" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">To</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Destination city" value={to} onChange={e => setTo(e.target.value)} list="tr-cities-to" />
                <datalist id="tr-cities-to">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
            <div className="form-group" style={{ minWidth: 170, marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ height: 50 }}>
              <Search size={18} /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Class filter chips — real IR codes */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CLASS_FILTERS.map(cf => (
            <button
              key={cf.id}
              onClick={() => setClassFilter(cf.id)}
              className="btn"
              style={{
                padding: '7px 13px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                background: classFilter === cf.id ? 'rgba(27,153,139,0.15)' : 'var(--color-surface-elevated)',
                border: classFilter === cf.id ? '1.5px solid var(--color-accent-teal)' : '1.5px solid transparent',
                color: classFilter === cf.id ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {cf.icon} {cf.label}
              {classFilter === cf.id && cf.id !== 'all' && (
                <X size={12} onClick={e => { e.stopPropagation(); setClassFilter('all'); }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontWeight: 700 }}>
          {displayed.length} train{displayed.length !== 1 ? 's' : ''} found
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--color-text-tertiary)" />
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Lowest Fare First</option>
            <option value="price-high">Highest Fare First</option>
            <option value="depart">Earliest Departure</option>
          </select>
        </div>
      </div>

      {/* Train cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
        {displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><TrainFront size={36} /></div>
            <h3>No trains found</h3>
            <p>Try different cities or remove class filters.</p>
          </div>
        ) : displayed.map(tr => {
          const classOpts   = classMap[tr.id] || [];
          const filteredOpts = classFilter !== 'all'
            ? classOpts.filter(co => co.classCode === classFilter)
            : classOpts;
          const availOpts   = filteredOpts.filter(o => o.status !== 'Waitlist');
          const minPrice    = availOpts.length ? Math.min(...availOpts.map(o => o.price)) : null;
          const isExpanded  = expandedId === tr.id;

          return (
            <div key={tr.id} className="trip-card" style={{ cursor: 'pointer' }}>
              {/* Route info row — clicking toggles class picker */}
              <div onClick={() => setExpandedId(isExpanded ? null : tr.id)} style={{ flex: 1 }}>
                <div className="trip-route">
                  <div className="trip-route-line">
                    <div className="trip-route-dot" />
                    <div>
                      <div className="trip-time">{tr.depart}</div>
                      <div className="trip-location">{tr.from}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                    <div className="trip-route-connector" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {tr.duration}
                    </span>
                  </div>
                  <div className="trip-route-line">
                    <div className="trip-route-dot end" />
                    <div>
                      <div className="trip-time">{tr.arrive}</div>
                      <div className="trip-location">{tr.to}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingLeft: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrainFront size={11} /> {tr.operator} ({tr.trainNumber})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                      {filteredOpts.length} class{filteredOpts.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price / expand panel */}
              <div className="trip-info" onClick={() => setExpandedId(isExpanded ? null : tr.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: 120 }}>
                <div style={{ textAlign: 'right' }}>
                  {minPrice !== null ? (
                    <>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>from</div>
                      <div className="trip-price">₹{minPrice.toLocaleString('en-IN')}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 700 }}>Waitlisted</div>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}
                >
                  {isExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View Classes</>}
                </button>
              </div>

              {/* Inline class picker (expanded) */}
              {isExpanded && (
                <div style={{ flex: '0 0 380px', paddingLeft: 24, borderLeft: '1px solid var(--color-border)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: 12, paddingLeft: 2, textTransform: 'uppercase' }}>
                    SELECT CLASS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filteredOpts.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)', padding: '8px 2px' }}>
                        No classes match the current filter.
                      </div>
                    ) : filteredOpts.map(co => (
                      <ClassPickerRow
                        key={co.id}
                        classOpt={co}
                        onSelect={(opt) => handleSelectClass(tr, opt)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
