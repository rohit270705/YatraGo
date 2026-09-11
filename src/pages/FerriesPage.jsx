import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, MapPin, ArrowRight, Clock, Search, SlidersHorizontal, X, Anchor, ChevronDown, ChevronUp } from 'lucide-react';

// ── Dummy ferry/cruise data (is_demo_data: true) ──────────────────────────────
const FERRY_SEED = [
  { id: 'fe-01', from: 'Mumbai',          to: 'Goa',                operator: 'Angriya Sea Eagle',           depart: '18:00', duration: '14h 00m', listingType: 'Overnight Cruise Ferry',  price: 2200,  seatsLeft: 40,          status: 'Available', mode: 'ferry' },
  { id: 'fe-02', from: 'Chennai',         to: 'Port Blair (Andaman)',operator: 'M.V. Nancowry',              depart: '20:00', duration: '60h 00m', listingType: 'Inter-Island',            price: 2850,  seatsLeft: 65,          status: 'Available', mode: 'ferry' },
  { id: 'fe-03', from: 'Port Blair',      to: 'Havelock Island',    operator: 'Makruzz Gold',                depart: '07:00', duration: '1h 30m',  listingType: 'Inter-Island',            price: 1150,  seatsLeft: 22,          status: 'Available', mode: 'ferry' },
  { id: 'fe-04', from: 'Kochi',           to: 'Alleppey (Backwaters)',operator: 'Kerala Tourism Ferry',      depart: '09:30', duration: '3h 00m',  listingType: 'River Cruise',            price: 400,   seatsLeft: 50,          status: 'Available', mode: 'ferry' },
  { id: 'fe-05', from: 'Mumbai',          to: 'Elephanta Caves',    operator: 'MTDC Launch',                 depart: '09:00', duration: '1h 00m',  listingType: 'Local Ferry',             price: 220,   seatsLeft: 80,          status: 'Available', mode: 'ferry' },
  { id: 'fe-06', from: 'Goa (Panaji)',    to: 'Goa River',          operator: 'Goa River Nightlife Cruise',  depart: '19:30', duration: '1h 30m',  listingType: 'River Cruise',            price: 550,   seatsLeft: 60,          status: 'Available', mode: 'ferry' },
  { id: 'fe-07', from: 'Chennai',         to: 'Colombo (Sri Lanka)',operator: 'Cordelia Cruises',            depart: '16:00', duration: '2 Nights',listingType: 'Luxury Cruise',           price: 14999, seatsLeft: 12,          status: 'Available', mode: 'ferry', cabinOptions: ['Standard Cabin', 'Deluxe Cabin', 'Suite'] },
  { id: 'fe-08', from: 'Mumbai',          to: 'Diu',                operator: 'Ro-Pax Ferry Service',        depart: '06:00', duration: '12h 00m', listingType: 'Inter-Island',            price: 1800,  seatsLeft: 30,          status: 'Available', mode: 'ferry' },
  { id: 'fe-09', from: 'Kolkata',         to: 'Port Blair',         operator: 'M.V. Swaraj Dweep',          depart: '18:00', duration: '66h 00m', listingType: 'Inter-Island',            price: 3100,  seatsLeft: 55,          status: 'Available', mode: 'ferry' },
  { id: 'fe-10', from: 'Vasco (Goa)',     to: 'Mumbai',             operator: 'Cordelia Cruises (Goa route)',depart: '20:00', duration: '1 Night', listingType: 'Luxury Cruise',           price: 9500,  seatsLeft: 18,          status: 'Available', mode: 'ferry', cabinOptions: ['Standard Cabin', 'Deluxe Cabin'] },
  { id: 'fe-11', from: 'Rameswaram',      to: 'Sri Lanka (seasonal)',operator: 'Indo-Lanka Ferry',          depart: '08:00', duration: '4h 30m',  listingType: 'Inter-Island',            price: 3500,  seatsLeft: 25,          status: 'Seasonal',  mode: 'ferry' },
  { id: 'fe-12', from: 'Kochi',           to: 'Munroe Island',      operator: 'Backwater Ferry Co-op',       depart: '10:00', duration: '2h 30m',  listingType: 'River Cruise',            price: 300,   seatsLeft: 40,          status: 'Available', mode: 'ferry' },
];

const TYPE_FILTERS = [
  { id: 'all',                  label: 'All Types',          icon: '⚓' },
  { id: 'Local Ferry',          label: 'Local Ferry',        icon: '⛵' },
  { id: 'Inter-Island',         label: 'Inter-Island',       icon: '🏝️' },
  { id: 'River Cruise',         label: 'River Cruise',       icon: '🛶' },
  { id: 'Luxury Cruise',        label: 'Luxury Cruise',      icon: '🚢' },
  { id: 'Overnight Cruise Ferry',label: 'Overnight Ferry',   icon: '🌙' },
];

function statusTag(s) {
  if (s === 'Seasonal') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '🌸 Seasonal' };
  return                       { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '✓ Available'  };
}

function seatsLabel(s) {
  // For luxury cruise, seatsLeft represents cabin count
  return s <= 15 ? `${s} cabins/seats left` : `${s} seats`;
}

const CITIES = ['Mumbai', 'Goa', 'Chennai', 'Port Blair', 'Kochi', 'Kolkata', 'Rameswaram', 'Havelock Island', 'Alleppey', 'Vasco', 'Diu', 'Panaji'];

export default function FerriesPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const [date, setDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price');
  const [hasSearched, setHasSearched] = useState(false);
  // Cabin selection for Luxury Cruise entries: { [ferryId]: selectedCabin }
  const [selectedCabins, setSelectedCabins] = useState({});

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const displayed = useMemo(() => {
    let base = FERRY_SEED;
    if (hasSearched) {
      if (from.trim()) base = base.filter(f => f.from.toLowerCase().includes(from.trim().toLowerCase()));
      if (to.trim())   base = base.filter(f => f.to.toLowerCase().includes(to.trim().toLowerCase()));
    }
    if (typeFilter !== 'all') base = base.filter(f => f.listingType === typeFilter);
    const sorted = [...base];
    if (sortBy === 'price')      sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'seats')      sorted.sort((a, b) => b.seatsLeft - a.seatsLeft);
    return sorted;
  }, [from, to, typeFilter, sortBy, hasSearched]);

  const typeCounts = useMemo(() => {
    const counts = { all: FERRY_SEED.length };
    TYPE_FILTERS.forEach(tf => {
      if (tf.id !== 'all') counts[tf.id] = FERRY_SEED.filter(f => f.listingType === tf.id).length;
    });
    return counts;
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🚢 Ferries / Cruise Ships</h1>
        <p>Coastal ferries, backwater cruises, and luxury voyages across India</p>
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">From</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Departure port/city" value={from} onChange={e => setFrom(e.target.value)} list="fe-cities-from" />
                <datalist id="fe-cities-from">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface)', flexShrink: 0, alignSelf: 'center', marginTop: 16 }}>
              <ArrowRight size={18} color="var(--color-accent-teal-light)" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">To</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Destination port/city" value={to} onChange={e => setTo(e.target.value)} list="fe-cities-to" />
                <datalist id="fe-cities-to">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
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

      {/* Type filter chips */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(tf => (
            <button
              key={tf.id}
              onClick={() => setTypeFilter(tf.id)}
              className="btn"
              style={{
                padding: '8px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                background: typeFilter === tf.id ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-elevated)',
                border: typeFilter === tf.id ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                color: typeFilter === tf.id ? '#60a5fa' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tf.icon} {tf.label}
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({typeCounts[tf.id] || 0})</span>
              {typeFilter === tf.id && tf.id !== 'all' && <X size={12} onClick={e => { e.stopPropagation(); setTypeFilter('all'); }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontWeight: 700 }}>
          {displayed.length} route{displayed.length !== 1 ? 's' : ''} available
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--color-text-tertiary)" />
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="seats">Most Availability</option>
          </select>
        </div>
      </div>

      {/* Ferry/Cruise cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
        {displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Ship size={36} /></div>
            <h3>No routes found</h3>
            <p>Try different ports or remove type filters.</p>
          </div>
        ) : displayed.map(fe => {
          const tag = statusTag(fe.status);
          // Is this a multi-day journey?
          const isMultiDay = fe.duration.toLowerCase().includes('night') || parseInt(fe.duration) > 24;

          const isLuxury    = fe.listingType === 'Luxury Cruise';
          const hasCabins   = isLuxury && fe.cabinOptions?.length > 0;
          const chosenCabin = selectedCabins[fe.id] || (hasCabins ? fe.cabinOptions[0] : null);

          const handleBook = () => navigate('/booking', {
            state: {
              transitListing: { ...fe, selectedCabin: chosenCabin },
              mode: 'ferry',
            },
          });

          return (
            <div key={fe.id} className="trip-card">
              {/* Route line */}
              <div className="trip-route">
                <div className="trip-route-line">
                  <div className="trip-route-dot" />
                  <div>
                    <div className="trip-time">{fe.depart}</div>
                    <div className="trip-location">{fe.from}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                  <div className="trip-route-connector" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    <span style={{ fontWeight: isMultiDay ? 700 : 400, color: isMultiDay ? 'var(--color-accent-amber)' : undefined }}>
                      {fe.duration}
                    </span>
                  </span>
                </div>
                <div className="trip-route-line">
                  <div className="trip-route-dot end" />
                  <div>
                    <div className="trip-time" style={{ color: isMultiDay ? 'var(--color-accent-amber)' : undefined }}>
                      {isMultiDay ? fe.duration : 'Arrives'}
                    </div>
                    <div className="trip-location">{fe.to}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingLeft: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Anchor size={11} /> {fe.operator}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                  }}>
                    {fe.listingType}
                  </span>
                </div>
              </div>

              {/* Info / price panel */}
              <div className="trip-info">
                <div className="trip-price">₹{fe.price.toLocaleString('en-IN')}</div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: tag.bg, color: tag.color }}>
                  {tag.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {seatsLabel(fe.seatsLeft)}
                </span>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleBook}>
                  {hasCabins ? 'Book →' : 'Book Now →'}
                </button>
              </div>

              {/* Cabin picker — Luxury Cruise only */}
              {hasCabins && (
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', paddingTop: 12, paddingBottom: 4 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em', marginBottom: 8 }}>SELECT CABIN TYPE</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {fe.cabinOptions.map(cabin => {
                      const active = chosenCabin === cabin;
                      return (
                        <button key={cabin} onClick={() => setSelectedCabins(prev => ({ ...prev, [fe.id]: cabin }))}
                          className="btn" style={{
                            padding: '7px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600,
                            background: active ? 'rgba(59,130,246,0.18)' : 'var(--color-surface-elevated)',
                            border: active ? '2px solid #3b82f6' : '1.5px solid var(--color-border)',
                            color: active ? '#60a5fa' : 'var(--color-text-secondary)',
                          }}>
                          🛏️ {cabin}
                        </button>
                      );
                    })}
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
