import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, MapPin, Calendar, ArrowRight, Clock, Search, SlidersHorizontal, X } from 'lucide-react';

// ── Dummy flight data (is_demo_data: true) ────────────────────────────────────
const FLIGHT_SEED = [
  { id: 'fl-01', from: 'Mumbai',    to: 'Delhi',     operator: 'IndiGo',       opCode: '6E-204',   depart: '06:15', arrive: '08:25', duration: '2h 10m', travelClass: 'Economy',          price: 4850,  seatsLeft: 23, mode: 'flight' },
  { id: 'fl-02', from: 'Delhi',     to: 'Bangalore', operator: 'Air India',    opCode: 'AI-505',   depart: '09:40', arrive: '12:25', duration: '2h 45m', travelClass: 'Economy',          price: 5600,  seatsLeft: 12, mode: 'flight' },
  { id: 'fl-03', from: 'Bangalore', to: 'Chennai',   operator: 'Vistara',      opCode: 'UK-825',   depart: '14:00', arrive: '15:05', duration: '1h 05m', travelClass: 'Economy',          price: 2900,  seatsLeft: 34, mode: 'flight' },
  { id: 'fl-04', from: 'Mumbai',    to: 'Goa',       operator: 'SpiceJet',     opCode: 'SG-411',   depart: '11:20', arrive: '12:35', duration: '1h 15m', travelClass: 'Economy',          price: 3400,  seatsLeft: 18, mode: 'flight' },
  { id: 'fl-05', from: 'Delhi',     to: 'Mumbai',    operator: 'Akasa Air',    opCode: 'QP-1102',  depart: '18:30', arrive: '20:45', duration: '2h 15m', travelClass: 'Premium Economy',  price: 7200,  seatsLeft: 8,  mode: 'flight' },
  { id: 'fl-06', from: 'Chennai',   to: 'Hyderabad', operator: 'IndiGo',       opCode: '6E-678',   depart: '07:50', arrive: '09:15', duration: '1h 25m', travelClass: 'Economy',          price: 3750,  seatsLeft: 27, mode: 'flight' },
  { id: 'fl-07', from: 'Mumbai',    to: 'Bangalore', operator: 'Vistara',      opCode: 'UK-953',   depart: '20:10', arrive: '21:45', duration: '1h 35m', travelClass: 'Business',         price: 12400, seatsLeft: 4,  mode: 'flight' },
  { id: 'fl-08', from: 'Kolkata',   to: 'Delhi',     operator: 'Air India',    opCode: 'AI-762',   depart: '16:00', arrive: '18:20', duration: '2h 20m', travelClass: 'Economy',          price: 5900,  seatsLeft: 15, mode: 'flight' },
  { id: 'fl-09', from: 'Bangalore', to: 'Goa',       operator: 'IndiGo',       opCode: '6E-337',   depart: '10:05', arrive: '11:20', duration: '1h 15m', travelClass: 'Economy',          price: 3100,  seatsLeft: 21, mode: 'flight' },
  { id: 'fl-10', from: 'Delhi',     to: 'Jaipur',    operator: 'Alliance Air', opCode: '9I-651',   depart: '13:15', arrive: '14:05', duration: '0h 50m', travelClass: 'Economy',          price: 2600,  seatsLeft: 30, mode: 'flight' },
  { id: 'fl-11', from: 'Hyderabad', to: 'Mumbai',    operator: 'Akasa Air',    opCode: 'QP-1408',  depart: '21:00', arrive: '22:35', duration: '1h 35m', travelClass: 'Economy',          price: 4200,  seatsLeft: 19, mode: 'flight' },
  { id: 'fl-12', from: 'Mumbai',    to: 'Kochi',     operator: 'IndiGo',       opCode: '6E-559',   depart: '05:45', arrive: '08:10', duration: '2h 25m', travelClass: 'Economy',          price: 5300,  seatsLeft: 11, mode: 'flight' },
];

const CLASS_FILTERS = [
  { id: 'all',              label: 'All Classes',       icon: '✈️' },
  { id: 'Economy',          label: 'Economy',           icon: '💺' },
  { id: 'Premium Economy',  label: 'Premium Economy',   icon: '🪑' },
  { id: 'Business',         label: 'Business',          icon: '🛋️' },
];

function seatsTag(n) {
  if (n > 15) return { label: `${n} seats`, color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (n >= 5)  return { label: `${n} seats`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return           { label: n === 0 ? 'Sold out' : `${n} left!`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Chennai', 'Hyderabad', 'Kolkata', 'Jaipur', 'Kochi', 'Ahmedabad', 'Pune', 'Chandigarh'];

export default function FlightsPage() {
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
    let base = FLIGHT_SEED;
    if (hasSearched) {
      if (from.trim()) base = base.filter(f => f.from.toLowerCase().includes(from.trim().toLowerCase()));
      if (to.trim())   base = base.filter(f => f.to.toLowerCase().includes(to.trim().toLowerCase()));
    }
    if (classFilter !== 'all') base = base.filter(f => f.travelClass === classFilter);
    const sorted = [...base];
    if (sortBy === 'price')       sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high')  sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'depart')      sorted.sort((a, b) => a.depart.localeCompare(b.depart));
    if (sortBy === 'seats')       sorted.sort((a, b) => b.seatsLeft - a.seatsLeft);
    return sorted;
  }, [from, to, classFilter, sortBy, hasSearched]);

  const classCounts = useMemo(() => {
    const counts = { all: FLIGHT_SEED.length };
    CLASS_FILTERS.forEach(cf => {
      if (cf.id !== 'all') counts[cf.id] = FLIGHT_SEED.filter(f => f.travelClass === cf.id).length;
    });
    return counts;
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>✈️ Flights</h1>
        <p>Domestic flights across India — book your seat instantly</p>
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">From</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Origin city" value={from} onChange={e => setFrom(e.target.value)} list="fl-cities-from" />
                <datalist id="fl-cities-from">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface)', flexShrink: 0, alignSelf: 'center', marginTop: 16 }}>
              <ArrowRight size={18} color="var(--color-accent-teal-light)" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">To</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Destination city" value={to} onChange={e => setTo(e.target.value)} list="fl-cities-to" />
                <datalist id="fl-cities-to">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
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
                padding: '8px 16px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
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
          {displayed.length} flight{displayed.length !== 1 ? 's' : ''} available
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--color-text-tertiary)" />
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="depart">Earliest Departure</option>
            <option value="seats">Most Seats First</option>
          </select>
        </div>
      </div>

      {/* Flight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
        {displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Plane size={36} /></div>
            <h3>No flights found</h3>
            <p>Try different cities or remove filters.</p>
          </div>
        ) : displayed.map(fl => {
          const tag = seatsTag(fl.seatsLeft);
          return (
            <div key={fl.id} className="trip-card" style={{ cursor: 'pointer' }} onClick={() =>
              navigate('/booking', { state: { transitListing: fl, mode: 'flight' } })
            }>
              {/* Route line */}
              <div className="trip-route">
                <div className="trip-route-line">
                  <div className="trip-route-dot" />
                  <div>
                    <div className="trip-time">{fl.depart}</div>
                    <div className="trip-location">{fl.from}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                  <div className="trip-route-connector" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {fl.duration}
                  </span>
                </div>
                <div className="trip-route-line">
                  <div className="trip-route-dot end" />
                  <div>
                    <div className="trip-time">{fl.arrive}</div>
                    <div className="trip-location">{fl.to}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingLeft: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plane size={11} /> {fl.operator} {fl.opCode}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-teal-light)' }}>
                    {fl.travelClass}
                  </span>
                </div>
              </div>

              {/* Info / price panel */}
              <div className="trip-info">
                <div className="trip-price">₹{fl.price.toLocaleString('en-IN')}</div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: tag.bg, color: tag.color }}>
                  {tag.label}
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
