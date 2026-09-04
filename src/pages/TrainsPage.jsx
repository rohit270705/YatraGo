import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainFront, MapPin, ArrowRight, Clock, Search, SlidersHorizontal, X } from 'lucide-react';

// ── Dummy train data (is_demo_data: true) ─────────────────────────────────────
const TRAIN_SEED = [
  { id: 'tr-01', from: 'Mumbai',    to: 'Pune',       operator: 'Deccan Queen',          opCode: '12123', depart: '07:15', arrive: '10:25', duration: '3h 10m',  travelClass: 'Sleeper (SL)',      price: 145,  status: 'Available', mode: 'train' },
  { id: 'tr-02', from: 'Delhi',     to: 'Jaipur',     operator: 'Ajmer Shatabdi',        opCode: '12015', depart: '06:05', arrive: '10:40', duration: '4h 35m',  travelClass: 'AC Chair Car',      price: 685,  status: 'Available', mode: 'train' },
  { id: 'tr-03', from: 'Mumbai',    to: 'Ahmedabad',  operator: 'Gujarat Mail',          opCode: '12902', depart: '21:25', arrive: '05:10', duration: '7h 45m',  travelClass: 'AC 3-Tier (3A)',    price: 890,  status: 'RAC',       mode: 'train' },
  { id: 'tr-04', from: 'Delhi',     to: 'Lucknow',    operator: 'Lucknow Mail',          opCode: '12229', depart: '22:00', arrive: '06:35', duration: '8h 35m',  travelClass: 'Sleeper (SL)',      price: 320,  status: 'Available', mode: 'train' },
  { id: 'tr-05', from: 'Chennai',   to: 'Bangalore',  operator: 'Shatabdi Express',      opCode: '12007', depart: '06:00', arrive: '10:30', duration: '4h 30m',  travelClass: 'AC Chair Car',      price: 750,  status: 'Available', mode: 'train' },
  { id: 'tr-06', from: 'Mumbai',    to: 'Goa',        operator: 'Mandovi Express',       opCode: '10103', depart: '07:10', arrive: '16:45', duration: '9h 35m',  travelClass: 'AC 2-Tier (2A)',    price: 1150, status: 'Available', mode: 'train' },
  { id: 'tr-07', from: 'Delhi',     to: 'Amritsar',   operator: 'Golden Temple Mail',    opCode: '12903', depart: '21:35', arrive: '05:50', duration: '8h 15m',  travelClass: 'AC 3-Tier (3A)',    price: 940,  status: 'Waitlist',  mode: 'train' },
  { id: 'tr-08', from: 'Kolkata',   to: 'Delhi',      operator: 'Rajdhani Express',      opCode: '12301', depart: '16:50', arrive: '10:00', duration: '17h 10m', travelClass: 'AC First (1A)',      price: 3450, status: 'Available', mode: 'train' },
  { id: 'tr-09', from: 'Bangalore', to: 'Hyderabad',  operator: 'Rajdhani Express',      opCode: '22691', depart: '20:00', arrive: '06:30', duration: '10h 30m', travelClass: 'AC 3-Tier (3A)',    price: 1320, status: 'Available', mode: 'train' },
  { id: 'tr-10', from: 'Mumbai',    to: 'Delhi',      operator: 'Rajdhani Express',      opCode: '12951', depart: '17:00', arrive: '08:35', duration: '15h 35m', travelClass: 'AC 2-Tier (2A)',    price: 2780, status: 'RAC',       mode: 'train' },
  { id: 'tr-11', from: 'Pune',      to: 'Bangalore',  operator: 'Udyan Express',         opCode: '11302', depart: '20:30', arrive: '12:15', duration: '15h 45m', travelClass: 'Sleeper (SL)',      price: 480,  status: 'Available', mode: 'train' },
  { id: 'tr-12', from: 'Delhi',     to: 'Chandigarh', operator: 'Shatabdi Express',      opCode: '12005', depart: '07:20', arrive: '10:40', duration: '3h 20m',  travelClass: 'AC Chair Car',      price: 640,  status: 'Available', mode: 'train' },
];

const CLASS_FILTERS = [
  { id: 'all',             label: 'All Classes',      icon: '🚂' },
  { id: 'Sleeper (SL)',    label: 'Sleeper (SL)',     icon: '🛏️' },
  { id: 'AC 3-Tier (3A)', label: 'AC 3-Tier (3A)',   icon: '❄️' },
  { id: 'AC 2-Tier (2A)', label: 'AC 2-Tier (2A)',   icon: '🌬️' },
  { id: 'AC First (1A)',  label: 'AC First (1A)',     icon: '👑' },
  { id: 'AC Chair Car',   label: 'AC Chair Car',      icon: '💺' },
];

function statusTag(s) {
  if (s === 'Available') return { color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (s === 'RAC')       return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return                        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

const CITIES = ['Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Amritsar', 'Chandigarh', 'Goa'];

export default function TrainsPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const [date, setDate] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const displayed = useMemo(() => {
    let base = TRAIN_SEED;
    if (hasSearched) {
      if (from.trim()) base = base.filter(t => t.from.toLowerCase().includes(from.trim().toLowerCase()));
      if (to.trim())   base = base.filter(t => t.to.toLowerCase().includes(to.trim().toLowerCase()));
    }
    if (classFilter !== 'all') base = base.filter(t => t.travelClass === classFilter);
    const sorted = [...base];
    if (sortBy === 'price')      sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'depart')     sorted.sort((a, b) => a.depart.localeCompare(b.depart));
    return sorted;
  }, [from, to, classFilter, sortBy, hasSearched]);

  const classCounts = useMemo(() => {
    const counts = { all: TRAIN_SEED.length };
    CLASS_FILTERS.forEach(cf => {
      if (cf.id !== 'all') counts[cf.id] = TRAIN_SEED.filter(t => t.travelClass === cf.id).length;
    });
    return counts;
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🚂 Trains</h1>
        <p>India's rail network at your fingertips — search, choose, book</p>
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

      {/* Class filter chips */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CLASS_FILTERS.map(cf => (
            <button
              key={cf.id}
              onClick={() => setClassFilter(cf.id)}
              className="btn"
              style={{
                padding: '8px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                background: classFilter === cf.id ? 'rgba(27,153,139,0.15)' : 'var(--color-surface-elevated)',
                border: classFilter === cf.id ? '1.5px solid var(--color-accent-teal)' : '1.5px solid transparent',
                color: classFilter === cf.id ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {cf.icon} {cf.label}
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({classCounts[cf.id] || 0})</span>
              {classFilter === cf.id && cf.id !== 'all' && <X size={12} onClick={e => { e.stopPropagation(); setClassFilter('all'); }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontWeight: 700 }}>
          {displayed.length} train{displayed.length !== 1 ? 's' : ''} available
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--color-text-tertiary)" />
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
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
          const tag = statusTag(tr.status);
          return (
            <div key={tr.id} className="trip-card" style={{ cursor: 'pointer' }} onClick={() =>
              navigate('/booking', { state: { transitListing: tr, mode: 'train' } })
            }>
              {/* Route line */}
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
                    <TrainFront size={11} /> {tr.operator} ({tr.opCode})
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-teal-light)' }}>
                    {tr.travelClass}
                  </span>
                </div>
              </div>

              {/* Info / price panel */}
              <div className="trip-info">
                <div className="trip-price">₹{tr.price.toLocaleString('en-IN')}</div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: tag.bg, color: tag.color }}>
                  {tr.status}
                </span>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                  Book Now →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
