import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowRight, Clock, Users, Luggage, Car, Filter, Bus, X, SlidersHorizontal } from 'lucide-react';
import { useBookingStore, useVehicleStore } from '../store';

const VEHICLE_TYPES = [
  { id: 'all', label: 'All Types', icon: '🚀', desc: 'Show all vehicles' },
  { id: 'Bus', label: 'Bus', icon: '🚌', desc: '30-40 seats • Budget-friendly' },
  { id: 'Mini Bus', label: 'Mini Bus', icon: '🚐', desc: '12-16 seats • Group trips' },
  { id: 'Tempo Traveller', label: 'Tempo', icon: '🚎', desc: '10-14 seats • Comfortable' },
  { id: 'SUV', label: 'SUV', icon: '🚗', desc: '6-7 seats • Premium' },
  { id: 'Sedan', label: 'Sedan', icon: '🚙', desc: '4 seats • Personal' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const { searchRoutes, searchResults, routes, fetchAllRoutes } = useBookingStore();
  const { vehicles } = useVehicleStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('all');
  const [sortBy, setSortBy] = useState('price'); // price, seats, departure
  const [hasSearched, setHasSearched] = useState(false);
  
  useEffect(() => {
    if (fetchAllRoutes) fetchAllRoutes();
  }, [fetchAllRoutes]);
  
  const [isLoading, setIsLoading] = useState(false);

  const getVehicle = (vehicleId) => vehicles.find(v => v.id === vehicleId);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await searchRoutes(from, to, date);
    setHasSearched(true);
    setIsLoading(false);
  };

  // Filter routes by vehicle type, then sort
  const displayRoutes = useMemo(() => {
    let base = hasSearched ? searchResults : routes;

    // Vehicle type filter
    if (selectedVehicleType !== 'all') {
      base = base.filter(route => {
        const vehicle = route.vehicle;
        return vehicle?.type === selectedVehicleType;
      });
    }

    // Sort
    const sorted = [...base];
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'seats':
        sorted.sort((a, b) => b.availableSeats - a.availableSeats);
        break;
      case 'departure':
        sorted.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
        break;
      default:
        break;
    }
    return sorted;
  }, [hasSearched, searchResults, routes, selectedVehicleType, sortBy]);

  // Count trips per vehicle type for badges
  const typeCounts = useMemo(() => {
    const base = hasSearched ? searchResults : routes;
    const counts = { all: base.length };
    VEHICLE_TYPES.forEach(vt => {
      if (vt.id !== 'all') {
        counts[vt.id] = base.filter(r => {
          const v = r.vehicle;
          return v?.type === vt.id;
        }).length;
      }
    });
    return counts;
  }, [hasSearched, searchResults, routes]);

  const cities = ['Mumbai', 'Pune', 'Bangalore', 'Goa', 'Delhi', 'Jaipur', 'Nashik', 'Mysore', 'Ahmedabad', 'Chennai', 'Hyderabad', 'Chandigarh', 'Agra', 'Surat'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Search Trips</h1>
        <p>Find the perfect ride for your journey — choose your preferred vehicle</p>
      </div>

      {isLoading && <div className="loading-spinner">Loading routes...</div>}
      {/* Search Form */}
      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label className="form-label">From</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter departure city"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  list="cities-from"
                />
                <datalist id="cities-from">
                  {cities.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface)',
              flexShrink: 0, alignSelf: 'center', marginTop: 16,
            }}>
              <ArrowRight size={18} color="var(--color-accent-teal-light)" />
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label className="form-label">To</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter destination city"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  list="cities-to"
                />
                <datalist id="cities-to">
                  {cities.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ height: 50 }}>
              <Search size={18} /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Vehicle Type Selector */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car size={18} /> Choose Vehicle Type
          </h3>
          {selectedVehicleType !== 'all' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVehicleType('all')}
              style={{ color: 'var(--color-accent-teal-light)', fontSize: '0.8rem' }}>
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
        }}>
          {VEHICLE_TYPES.map(vt => (
            <div
              key={vt.id}
              onClick={() => setSelectedVehicleType(vt.id)}
              style={{
                padding: '14px 12px',
                borderRadius: 'var(--radius-md)',
                background: selectedVehicleType === vt.id
                  ? 'rgba(27, 153, 139, 0.15)'
                  : 'var(--color-surface-elevated)',
                border: selectedVehicleType === vt.id
                  ? '1.5px solid var(--color-accent-teal)'
                  : '1.5px solid transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 200ms ease',
                opacity: typeCounts[vt.id] === 0 && vt.id !== 'all' ? 0.4 : 1,
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{vt.icon}</div>
              <div style={{
                fontWeight: 600, fontSize: '0.8125rem',
                color: selectedVehicleType === vt.id ? 'var(--color-accent-teal-light)' : 'var(--color-text-primary)',
              }}>
                {vt.label}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                {vt.desc}
              </div>
              {/* Trip count badge */}
              <div style={{
                position: 'absolute', top: 6, right: 6,
                background: selectedVehicleType === vt.id ? 'var(--color-accent-teal)' : 'var(--color-surface)',
                color: selectedVehicleType === vt.id ? 'white' : 'var(--color-text-tertiary)',
                fontSize: '0.6rem', fontWeight: 700,
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {typeCounts[vt.id] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedVehicleType !== 'all' && (
            <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
              {VEHICLE_TYPES.find(v => v.id === selectedVehicleType)?.icon} {selectedVehicleType}
            </span>
          )}
          {hasSearched
            ? `${displayRoutes.length} trip${displayRoutes.length !== 1 ? 's' : ''} found`
            : `${displayRoutes.length} available trip${displayRoutes.length !== 1 ? 's' : ''}`
          }
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--color-text-tertiary)" />
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem' }}
            value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="seats">Most Seats First</option>
            <option value="departure">Earliest Departure</option>
          </select>
        </div>
      </div>

      {/* Trip Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
        {displayRoutes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={36} /></div>
            <h3>No {selectedVehicleType !== 'all' ? selectedVehicleType + ' ' : ''}trips found</h3>
            <p>
              {selectedVehicleType !== 'all'
                ? `No ${selectedVehicleType} trips available for this route. Try "All Types" or different cities.`
                : 'Try different cities or dates. All our routes are shown below.'
              }
            </p>
            {selectedVehicleType !== 'all' && (
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedVehicleType('all')}>
                Show All Vehicle Types
              </button>
            )}
          </div>
        ) : (
          displayRoutes.map(route => {
            const vehicle = route.vehicle;
            const vehicleEmoji = vehicle?.type === 'Bus' ? '🚌'
              : vehicle?.type === 'Mini Bus' ? '🚐'
              : vehicle?.type === 'Tempo Traveller' ? '🚎'
              : vehicle?.type === 'Sedan' ? '🚙'
              : '🚗';
            return (
              <div key={route.id} className="trip-card" onClick={() => navigate(`/book/${route.id}`)}>
                <div className="trip-route">
                  <div className="trip-route-line">
                    <div className="trip-route-dot" />
                    <div>
                      <div className="trip-time">{route.departureTime}</div>
                      <div className="trip-location">{route.from}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                    <div className="trip-route-connector" />
                    {route.stops.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        via {route.stops.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="trip-route-line">
                    <div className="trip-route-dot end" />
                    <div>
                      <div className="trip-time">{route.arrivalTime}</div>
                      <div className="trip-location">{route.to}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingLeft: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {route.date}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Car size={12} /> {vehicle?.type || 'Vehicle'} • {vehicle?.registrationNumber}
                    </span>
                  </div>
                </div>

                <div className="trip-info">
                  <div className="trip-price">₹{route.price}</div>
                  <div className="trip-vehicle-type">
                    <span style={{ fontSize: '1rem' }}>{vehicleEmoji}</span> {vehicle?.type}
                  </div>
                  <div className="trip-seats">
                    {route.availableSeats} seats available
                  </div>
                  <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>
                    {route.luggageAvailable}kg luggage
                  </span>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    Book Now →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
