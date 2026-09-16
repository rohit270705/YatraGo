import { useState, useMemo } from 'react';
import { MapPin, Calendar, Search, Users, CarFront, Plus, Star, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useSharedRideStore, useAuthStore, useToastStore } from '../store';
import useAuthGate from '../hooks/useAuthGate';
import SkeletonLoader from '../components/SkeletonLoader';

function PublishRideModal({ isOpen, onClose }) {
  const { publishRide } = useSharedRideStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    departureTime: '09:00',
    arrivalTime: '11:00',
    vehicleType: 'Private Car',
    vehicleName: '',
    totalSeats: 4,
    availableSeats: 3,
    pricePerSeat: 500
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRide = {
      ...formData,
      driverName: user?.name || 'Driver',
      driverRating: 5.0,
      driverImage: user?.avatarUrl || null
    };
    publishRide(newRide);
    addToast('Ride published successfully!', 'success');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-scale-up" style={{ maxWidth: 500 }}>
        <h2 style={{ marginBottom: 16 }}>Publish a Shared Ride</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
          Offer empty seats in your vehicle and earn money while travelling.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">From City</label>
              <input required type="text" className="input" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="form-label">To City</label>
              <input required type="text" className="input" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} placeholder="e.g. Pune" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Date</label>
              <input required type="date" className="input" value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Departure</label>
              <input required type="time" className="input" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Arrival</label>
              <input required type="time" className="input" value={formData.arrivalTime} onChange={e => setFormData({...formData, arrivalTime: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vehicle Type</label>
              <select className="input" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', width: '100%', color: 'var(--color-text)' }} value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})}>
                <option value="Private Car">Private Car</option>
                <option value="Auto">Auto (Rickshaw)</option>
                <option value="Taxi">Taxi</option>
                <option value="E-Taxi">E-Taxi (EV)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Vehicle Model/Name</label>
              <input required type="text" className="input" value={formData.vehicleName} onChange={e => setFormData({...formData, vehicleName: e.target.value})} placeholder="e.g. Maruti Swift" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Total Seats</label>
              <input required type="number" min="1" max="15" className="input" value={formData.totalSeats} onChange={e => setFormData({...formData, totalSeats: Number(e.target.value)})} />
            </div>
            <div>
              <label className="form-label">Offering Seats</label>
              <input required type="number" min="1" max={formData.totalSeats} className="input" value={formData.availableSeats} onChange={e => setFormData({...formData, availableSeats: Number(e.target.value)})} />
            </div>
            <div>
              <label className="form-label">Price/Seat (₹)</label>
              <input required type="number" min="10" className="input" value={formData.pricePerSeat} onChange={e => setFormData({...formData, pricePerSeat: Number(e.target.value)})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Ride</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SharingCabsPage() {
  const { sharedRides, isLoading, bookSeats } = useSharedRideStore();
  const { addToast } = useToastStore();
  const gate = useAuthGate();

  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayedRides = useMemo(() => {
    let base = sharedRides;
    if (hasSearched) {
      if (fromSearch.trim()) base = base.filter(r => r.from.toLowerCase().includes(fromSearch.trim().toLowerCase()));
      if (toSearch.trim()) base = base.filter(r => r.to.toLowerCase().includes(toSearch.trim().toLowerCase()));
      if (dateSearch) base = base.filter(r => r.date === dateSearch);
      base = base.filter(r => r.availableSeats >= seatsNeeded);
    }
    return base.filter(r => r.availableSeats > 0); // Only show rides with available seats
  }, [sharedRides, hasSearched, fromSearch, toSearch, dateSearch, seatsNeeded]);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleBook = (rideId) => {
    gate(() => {
      bookSeats(rideId, seatsNeeded);
      addToast(`Successfully booked ${seatsNeeded} seat(s)!`, 'success');
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Shared Cabs & Carpooling</h1>
          <p>Travel together, save money, and help vehicle owners earn.</p>
        </div>
        <button className="btn btn-primary" onClick={() => gate(() => setIsModalOpen(true))}>
          <Plus size={16} /> Offer a Ride
        </button>
      </div>

      <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
              <label className="form-label">Leaving from</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Origin" value={fromSearch} onChange={e => setFromSearch(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
              <label className="form-label">Going to</label>
              <div className="form-input-icon-wrapper">
                <MapPin className="form-input-icon" size={20} />
                <input className="form-input" placeholder="Destination" value={toSearch} onChange={e => setToSearch(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ minWidth: 140, marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={dateSearch} onChange={e => setDateSearch(e.target.value)} style={{ paddingLeft: 12 }} />
            </div>
            <div className="form-group" style={{ width: 120, marginBottom: 0 }}>
              <label className="form-label">Seats</label>
              <div className="form-input-icon-wrapper">
                <Users className="form-input-icon" size={16} style={{ left: 12 }} />
                <select className="form-input" value={seatsNeeded} onChange={e => setSeatsNeeded(Number(e.target.value))} style={{ paddingLeft: 36 }}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ height: 48, padding: '0 24px' }}>
              <Search size={18} /> Search
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger-children">
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Available Rides</h3>
        
        {isLoading ? (
          <SkeletonLoader type="list" count={3} />
        ) : displayedRides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}><CarFront size={36} /></div>
            <h3>No shared rides found</h3>
            <p>Try different search criteria or check back later.</p>
          </div>
        ) : displayedRides.map(ride => (
          <div key={ride.id} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              {/* Route & Timing */}
              <div style={{ flex: 1, minWidth: 250 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{ride.departureTime}</div>
                  <div style={{ flex: 1, height: 2, background: 'var(--color-border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-surface)', padding: '2px 8px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      {ride.date}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{ride.arrivalTime}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  <div>{ride.from}</div>
                  <div>{ride.to}</div>
                </div>
              </div>
              
              {/* Divider for desktop */}
              <div style={{ width: 1, background: 'var(--color-border)' }} className="hidden md:block"></div>

              {/* Driver & Vehicle */}
              <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--color-surface-elevated)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ride.driverImage ? <img src={ride.driverImage} alt={ride.driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {ride.driverName} <ShieldCheck size={14} color="var(--color-accent-blue)" />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Star size={12} color="var(--color-accent-amber)" fill="var(--color-accent-amber)" /> {ride.driverRating}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 6, fontWeight: 500 }}>
                    {ride.vehicleType} • {ride.vehicleName}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div style={{ minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent-teal-light)' }}>
                  ₹{ride.pricePerSeat}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
                  per seat
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '0.85rem', color: ride.availableSeats < 3 ? 'var(--color-accent-amber)' : 'var(--color-accent-green)', fontWeight: 600 }}>
                    {ride.availableSeats} seat(s) left
                  </div>
                  <button className="btn btn-primary" onClick={() => handleBook(ride.id)} disabled={ride.availableSeats < seatsNeeded}>
                    Book {seatsNeeded} Seat(s) <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PublishRideModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
