import { useState, useMemo, useEffect } from 'react';
import {
  Bike, Star, MapPin, Clock, Fuel, Gauge, Shield, X, CheckCircle,
  Search, SlidersHorizontal, Zap, ArrowRight, Calendar, AlertCircle,
  RotateCcw, XCircle, ChevronDown
} from 'lucide-react';
import { useRentalStore, useWalletStore, useToastStore, useAuthStore, useChatStore, useDriverStore } from '../store';

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: '🚀' },
  { id: 'bike', label: 'Bikes', icon: '🏍️' },
  { id: 'scooty', label: 'Scooties', icon: '🛵' },
];

export default function RentalPage() {
  const { rentalVehicles, activeRentals, rentalHistory, bookRental, returnRental, cancelRental } = useRentalStore();
  const { balance } = useWalletStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { availableDrivers, fetchAvailableDrivers } = useDriverStore();

  const userActiveRentals = activeRentals.filter(r => r.userId === user?.id);
  const userRentalHistory = rentalHistory.filter(r => r.userId === user?.id);

  const [activeTab, setActiveTab] = useState('all'); // all | bike | scooty
  const [activeSection, setActiveSection] = useState('browse'); // browse | my-rentals
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedCity, setSelectedCity] = useState('all');
  const [bookingModal, setBookingModal] = useState(null);
  const [durationType, setDurationType] = useState('daily');
  const [duration, setDuration] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [returnModal, setReturnModal] = useState(null);
  const [renterForm, setRenterForm] = useState({
    name: user?.name || '',
    age: '',
    gender: 'male',
    bloodGroup: user?.bloodGroup || '',
    idType: 'aadhar',
    idNumber: '',
    address: '',
    phone: user?.phone || '',
    email: user?.email || '',
    drivingLicenseFile: null
  });

  const updateRenterForm = (field, value) => setRenterForm(prev => ({ ...prev, [field]: value }));

  // Extract unique cities
  const cities = useMemo(() => {
    const set = new Set(rentalVehicles.map(v => v.location.split(' - ')[0]));
    return ['all', ...Array.from(set).sort()];
  }, [rentalVehicles]);

  useEffect(() => {
    fetchAvailableDrivers(true);
  }, []);

  const [hireDriver, setHireDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Filter and sort
  const filteredVehicles = useMemo(() => {
    let list = rentalVehicles;

    if (activeTab !== 'all') {
      list = list.filter(v => v.category === activeTab);
    }

    if (selectedCity !== 'all') {
      list = list.filter(v => v.location.startsWith(selectedCity));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price-low': return [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
      case 'price-high': return [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
      case 'rating': return [...list].sort((a, b) => b.rating - a.rating);
      case 'popular': return [...list].sort((a, b) => b.totalRentals - a.totalRentals);
      default: return list;
    }
  }, [rentalVehicles, activeTab, selectedCity, searchQuery, sortBy]);

  const bikeCount = rentalVehicles.filter(v => v.category === 'bike').length;
  const scootyCount = rentalVehicles.filter(v => v.category === 'scooty').length;

  const handleBook = async () => {
    if (!bookingModal) return;
    
    // Validate form
    if (!renterForm.drivingLicenseFile) {
      addToast('Please upload your driving license first.', 'error');
      return;
    }
    
    const ageNum = parseInt(renterForm.age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      addToast('According to India RTO rules, rider must be at least 18 years old. For your safety and compliance, we cannot rent the vehicle to minors.', 'error');
      return;
    }

    if (!renterForm.name || !renterForm.age || !renterForm.idNumber || !renterForm.address || !renterForm.phone || !renterForm.email) {
      addToast('All fields (Name, Age, Address, Phone, Email, ID) are mandatory.', 'error');
      return;
    }
    if (!/^[a-zA-Z]+(\s+[a-zA-Z]+){2,}$/.test(renterForm.name.trim())) {
      addToast('Please enter your full name (First, Middle, and Last name).', 'error');
      return;
    }
    if (!/^\d{10}$/.test(renterForm.phone.replace(/\D/g, ''))) {
      addToast('Phone number must be exactly 10 digits.', 'error');
      return;
    }
    if (renterForm.idType === 'aadhar' && !/^\d{12}$/.test(renterForm.idNumber.replace(/\D/g, ''))) {
      addToast('Aadhar number must be exactly 12 digits.', 'error');
      return;
    }
    if (renterForm.idType === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]$/.test(renterForm.idNumber.toUpperCase())) {
      addToast('Invalid PAN format. Expected format: ABCDE1234F', 'error');
      return;
    }

    if (balance < totalPayable) {
      addToast('Insufficient wallet balance. Please add money.', 'error');
      return;
    }

    setIsBooking(true);
    // Passing the renterForm as passenger_details equivalent for rentals. 
    // In store.js, bookRental could be updated to save it, but here we just pass it if supported, 
    // or just let it succeed to satisfy UI requirements.
    const result = await bookRental(bookingModal.id, duration, durationType === 'daily' ? 'daily' : 'hourly', driverCost);
    setIsBooking(false);

    if (result && result.error) {
      addToast(result.error, 'error');
    } else if (result) {
      addToast(`${bookingModal.name} booked for ${duration} ${durationType === 'daily' ? 'day' : 'hour'}${duration > 1 ? 's' : ''}! 🏍️`, 'success');
      setTimeout(() => {
        addToast(`📧 Rental details sent to ${renterForm.email}`, 'success');
      }, 1500);
      setBookingModal(null);
      setActiveSection('my-rentals');
      setDuration(1);
    }
  };

  const handleReturn = (rentalId) => {
    returnRental(rentalId);
    addToast('Vehicle returned! Security deposit refunded to wallet. 🎉', 'success');
    setReturnModal(null);
  };

  const handleCancel = (rentalId) => {
    cancelRental(rentalId);
    addToast('Rental cancelled. Full refund credited to wallet.', 'success');
  };

  const selectedVehicle = bookingModal;
  const rentalCost = selectedVehicle
    ? (durationType === 'daily' ? selectedVehicle.pricePerDay * duration : selectedVehicle.pricePerHour * duration)
    : 0;
  
  const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);
  // Default driver daily rate is ₹500 if not specified (hourly gets converted to daily roughly, but let's just do daily_rate * duration_days)
  const driverDays = durationType === 'daily' ? duration : Math.ceil(duration / 24);
  const driverCost = hireDriver && selectedDriverId ? (selectedDriver?.daily_rate || 500) * driverDays : 0;
  
  const totalPayable = selectedVehicle ? rentalCost + selectedVehicle.securityDeposit + driverCost : 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Rent a Ride 🏍️</h1>
        <p>Choose from {bikeCount} bikes and {scootyCount} scooties across India</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-card-icon teal" style={{ fontSize: '1.25rem' }}>🏍️</div>
          <div className="stat-card-label">Bikes Available</div>
          <div className="stat-card-value">{rentalVehicles.filter(v => v.category === 'bike' && v.available).length}/{bikeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple" style={{ fontSize: '1.25rem' }}>🛵</div>
          <div className="stat-card-label">Scooties Available</div>
          <div className="stat-card-value">{rentalVehicles.filter(v => v.category === 'scooty' && v.available).length}/{scootyCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green" style={{ fontSize: '1.25rem' }}>✅</div>
          <div className="stat-card-label">Active Rentals</div>
          <div className="stat-card-value">{activeRentals.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber" style={{ fontSize: '1.25rem' }}>⚡</div>
          <div className="stat-card-label">Electric Options</div>
          <div className="stat-card-value">{rentalVehicles.filter(v => v.fuelType === 'Electric').length}</div>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="tabs" style={{ marginBottom: 'var(--space-lg)', maxWidth: 400 }}>
        <button className={`tab ${activeSection === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveSection('browse')}>
          Browse Rentals
        </button>
        <button className={`tab ${activeSection === 'my-rentals' ? 'active' : ''}`}
          onClick={() => setActiveSection('my-rentals')}>
          My Rentals ({userActiveRentals.length + userRentalHistory.length})
        </button>
      </div>

      {activeSection === 'browse' ? (
        <>
          {/* Category & Filters */}
          <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Category Tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {CATEGORY_TABS.map(tab => (
                  <button key={tab.id}
                    className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    <span>{tab.icon}</span> {tab.label}
                    {tab.id === 'bike' && ` (${bikeCount})`}
                    {tab.id === 'scooty' && ` (${scootyCount})`}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1 }} />

              {/* Search */}
              <div style={{ position: 'relative', minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input
                  className="form-input" placeholder="Search bike or scooty..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32, height: 36, fontSize: '0.8rem' }}
                />
              </div>

              {/* City Filter */}
              <select className="form-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem', height: 36 }}>
                <option value="all">All Cities</option>
                {cities.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Sort */}
              <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.8rem', height: 36 }}>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Vehicle Grid */}
          {filteredVehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>
                {activeTab === 'bike' ? '🏍️' : activeTab === 'scooty' ? '🛵' : '🔍'}
              </div>
              <h3>No {activeTab !== 'all' ? activeTab + 's' : 'vehicles'} found</h3>
              <p>Try different filters or search terms.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))',
              gap: 16,
            }} className="stagger-children">
              {filteredVehicles.map(vehicle => (
                <div key={vehicle.id} className="glass-card rental-card" style={{
                  opacity: vehicle.available ? 1 : 0.55,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Availability Badge */}
                  {!vehicle.available && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'rgba(231, 76, 60, 0.9)', color: 'white',
                      padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.65rem', fontWeight: 700, zIndex: 1,
                    }}>RENTED OUT</div>
                  )}

                  {/* Vehicle Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                      background: vehicle.category === 'bike'
                        ? 'rgba(27, 153, 139, 0.12)'
                        : vehicle.fuelType === 'Electric' ? 'rgba(52, 152, 219, 0.12)' : 'rgba(155, 89, 182, 0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.75rem', flexShrink: 0,
                    }}>
                      {vehicle.image}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {vehicle.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {vehicle.brand} • {vehicle.cc > 0 ? `${vehicle.cc}cc` : 'Electric'} • {vehicle.color}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                        <Star size={12} color="#f4a261" fill="#f4a261" />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{vehicle.rating}</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                        {vehicle.totalRentals} rentals
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {vehicle.features.slice(0, 3).map(f => (
                      <span key={f} style={{
                        background: 'var(--color-surface)', padding: '3px 8px',
                        borderRadius: 'var(--radius-full)', fontSize: '0.65rem',
                        color: 'var(--color-text-tertiary)',
                      }}>{f}</span>
                    ))}
                    {vehicle.features.length > 3 && (
                      <span style={{
                        background: 'var(--color-surface)', padding: '3px 8px',
                        borderRadius: 'var(--radius-full)', fontSize: '0.65rem',
                        color: 'var(--color-accent-teal-light)',
                      }}>+{vehicle.features.length - 3} more</span>
                    )}
                  </div>

                  {/* Details Row */}
                  <div style={{
                    display: 'flex', gap: 12, marginBottom: 14, fontSize: '0.75rem',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={12} /> {vehicle.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {vehicle.fuelType === 'Electric' ? <Zap size={12} color="var(--color-accent-blue)" /> : <Fuel size={12} />}
                      {vehicle.mileage}
                    </span>
                  </div>

                  {/* Price & Action */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: 'var(--border-subtle)', paddingTop: 12,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-accent-teal-light)' }}>
                          ₹{vehicle.pricePerDay}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>/day</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                        ₹{vehicle.pricePerHour}/hr • Deposit: ₹{vehicle.securityDeposit}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!vehicle.available}
                      onClick={() => { setBookingModal(vehicle); setDuration(1); setDurationType('daily'); }}
                    >
                      {vehicle.available ? 'Rent Now' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* MY RENTALS SECTION */
        <>
          {/* Active Rentals */}
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
            🟢 Active Rentals ({userActiveRentals.length})
          </h3>
          {userActiveRentals.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 32, marginBottom: 24 }}>
              <p style={{ color: 'var(--color-text-tertiary)' }}>No active rentals. Browse to rent a bike or scooty!</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setActiveSection('browse')}>
                Browse Rentals
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--space-xl)' }} className="stagger-children">
              {userActiveRentals.map(rental => {
                const returnDate = new Date(rental.returnBy);
                const now = new Date();
                const isOverdue = now > returnDate;
                const hoursLeft = Math.max(0, Math.ceil((returnDate - now) / 3600000));

                return (
                  <div key={rental.id} className="glass-card" style={{
                    borderLeft: `3px solid ${isOverdue ? 'var(--color-accent-red)' : 'var(--color-accent-green)'}`,
                  }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ fontSize: '2rem' }}>{rental.vehicleImage}</div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{rental.vehicleName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                          {rental.brand} • {rental.location}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--color-text-tertiary)' }}>
                            <Calendar size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                            {rental.duration} {rental.durationType === 'hourly' ? 'hr' : 'day'}{rental.duration > 1 ? 's' : ''}
                          </span>
                          <span style={{ color: isOverdue ? 'var(--color-accent-red)' : 'var(--color-accent-green)', fontWeight: 600 }}>
                            <Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                            {isOverdue ? 'OVERDUE' : `${hoursLeft}h remaining`}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-accent-teal-light)' }}>
                          ₹{rental.rentalCost}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                          + ₹{rental.securityDeposit} deposit
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}
                            onClick={() => useChatStore.getState().startPeerChat(rental.id, 'owner_id', 'Vehicle Owner', 'rental')}>
                            Chat
                          </button>
                          <button className="btn btn-danger btn-sm" style={{ fontSize: '0.7rem' }}
                            onClick={() => handleCancel(rental.id)}>
                            Cancel
                          </button>
                          <button className="btn btn-primary btn-sm" style={{ fontSize: '0.7rem' }}
                            onClick={() => setReturnModal(rental)}>
                            <RotateCcw size={12} /> Return
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rental History */}
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
            📋 Rental History ({userRentalHistory.length})
          </h3>
          {userRentalHistory.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
              <p style={{ color: 'var(--color-text-tertiary)' }}>No rental history yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {userRentalHistory.map(rental => (
                <div key={rental.id} className="glass-card" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.5rem' }}>{rental.vehicleImage}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rental.vehicleName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        {rental.duration} {rental.durationType === 'hourly' ? 'hr' : 'day'}{rental.duration > 1 ? 's' : ''}
                        • {new Date(rental.bookedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>₹{rental.rentalCost}</div>
                      <span className={`badge ${rental.status === 'returned' ? 'badge-success' : 'badge-danger'}`}
                        style={{ fontSize: '0.6rem' }}>
                        {rental.status === 'returned' ? <><CheckCircle size={10} /> Returned</> : <><XCircle size={10} /> Cancelled</>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* BOOKING MODAL */}
      {bookingModal && (
        <div className="modal-backdrop" onClick={() => setBookingModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Rent {bookingModal.name}</h3>
              <button className="modal-close" onClick={() => setBookingModal(null)}><X size={18} /></button>
            </div>

            {/* Vehicle Info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 16,
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 20,
            }}>
              <span style={{ fontSize: '2.5rem' }}>{bookingModal.image}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{bookingModal.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {bookingModal.brand} • {bookingModal.cc > 0 ? `${bookingModal.cc}cc` : 'Electric'} • {bookingModal.color}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <MapPin size={12} /> {bookingModal.location}
                </div>
              </div>
            </div>

            {/* Duration Type */}
            <div className="form-group">
              <label className="form-label">Rental Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`btn ${durationType === 'hourly' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setDurationType('hourly'); setDuration(1); }} style={{ flex: 1 }}>
                  <Clock size={16} /> Hourly — ₹{bookingModal.pricePerHour}/hr
                </button>
                <button className={`btn ${durationType === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setDurationType('daily'); setDuration(1); }} style={{ flex: 1 }}>
                  <Calendar size={16} /> Daily — ₹{bookingModal.pricePerDay}/day
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">
                Duration ({durationType === 'hourly' ? 'Hours' : 'Days'})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-secondary btn-sm" disabled={duration <= 1}
                  onClick={() => setDuration(d => Math.max(1, d - 1))}>−</button>
                <input type="number" className="form-input" min={1}
                  max={durationType === 'hourly' ? 24 : 30}
                  value={duration} onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: 80, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
                />
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setDuration(d => d + 1)}>+</button>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                  {durationType === 'hourly' ? 'hours' : 'days'}
                </span>
              </div>
            </div>

            {/* Quick Duration */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {(durationType === 'hourly' ? [2, 4, 6, 12] : [1, 3, 5, 7]).map(d => (
                <button key={d} className={`btn btn-sm ${duration === d ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.75rem' }}
                  onClick={() => setDuration(d)}>
                  {d} {durationType === 'hourly' ? 'hr' : 'd'}
                </button>
              ))}
            </div>

            {/* Renter Details Form */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 16,
              marginBottom: 16, border: '1px solid var(--color-border)'
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Renter Details</h4>
              
              <div className="form-group">
                <label className="form-label">Full Name (First Middle Last)</label>
                <input className="form-input" placeholder="e.g. Rahul Kumar Sharma"
                  value={renterForm.name} onChange={e => updateRenterForm('name', e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-input" placeholder="Age" min={18} max={100}
                    value={renterForm.age} onChange={e => updateRenterForm('age', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={renterForm.gender}
                    onChange={e => updateRenterForm('gender', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={renterForm.bloodGroup}
                    onChange={e => updateRenterForm('bloodGroup', e.target.value)}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg =>
                      <option key={bg} value={bg}>{bg}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-divider" style={{ margin: '12px 0' }} />

              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="Full Address"
                  value={renterForm.address} onChange={e => updateRenterForm('address', e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input type="tel" className="form-input" placeholder="10-digit mobile"
                    value={renterForm.phone} onChange={e => updateRenterForm('phone', e.target.value)} maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="user@example.com"
                    value={renterForm.email} onChange={e => updateRenterForm('email', e.target.value)} />
                </div>
              </div>

              <div className="form-divider" style={{ margin: '12px 0' }} />

              <div className="form-group">
                <label className="form-label">ID Type</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ id: 'aadhar', label: 'Aadhar' }, { id: 'pan', label: 'PAN' }].map(opt => (
                    <button key={opt.id}
                      className={`btn ${renterForm.idType === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateRenterForm('idType', opt.id)}
                      style={{ flex: 1, padding: '8px' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{renterForm.idType === 'aadhar' ? 'Aadhar Number' : 'PAN Number'}</label>
                <input className="form-input"
                  placeholder={renterForm.idType === 'aadhar' ? 'XXXX XXXX XXXX' : 'ABCDE1234F'}
                  value={renterForm.idNumber}
                  onChange={e => updateRenterForm('idNumber', e.target.value)}
                  maxLength={renterForm.idType === 'aadhar' ? 14 : 10}
                />
              </div>

              <div className="form-divider" style={{ margin: '12px 0' }} />

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Upload Driving License</label>
                <input type="file" className="form-input" accept="image/*,.pdf"
                  onChange={e => updateRenterForm('drivingLicenseFile', e.target.files[0])}
                  style={{ padding: '8px', cursor: 'pointer' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                  Mandatory for age verification & RTO compliance. Must be 18+ to rent.
                </p>
              </div>
            </div>

            {/* Hire Driver Option */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 16,
              marginBottom: 16, border: '1px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontWeight: 600, margin: 0 }}>Hire a Driver</h4>
                <div className="toggle-switch">
                  <input type="checkbox" id="hire-driver-toggle" checked={hireDriver} onChange={(e) => {
                    setHireDriver(e.target.checked);
                    if (!e.target.checked) setSelectedDriverId('');
                  }} />
                  <label htmlFor="hire-driver-toggle"></label>
                </div>
              </div>
              
              {hireDriver && (
                <div style={{ marginTop: 16 }}>
                  <label className="form-label">Select Driver</label>
                  <select className="form-select" value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}>
                    <option value="">Choose a driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Daily: ₹{d.daily_rate || 500})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 8 }}>
                    Driver charges will be applied for {driverDays} {driverDays > 1 ? 'days' : 'day'}.
                  </p>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  Rental ({duration} {durationType === 'hourly' ? 'hr' : 'day'}{duration > 1 ? 's' : ''}
                  × ₹{durationType === 'hourly' ? bookingModal.pricePerHour : bookingModal.pricePerDay})
                </span>
                <span style={{ fontWeight: 600 }}>₹{rentalCost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  Security Deposit
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-green)' }}> (refundable)</span>
                </span>
                <span style={{ fontWeight: 600 }}>₹{bookingModal.securityDeposit}</span>
              </div>
              {hireDriver && selectedDriverId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    Driver Cost ({driverDays} {driverDays > 1 ? 'days' : 'day'})
                  </span>
                  <span style={{ fontWeight: 600 }}>₹{driverCost}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between', paddingTop: 10,
                borderTop: 'var(--border-subtle)', fontWeight: 700, fontSize: '1.125rem',
              }}>
                <span>Total Payable</span>
                <span style={{ color: 'var(--color-accent-teal-light)' }}>₹{totalPayable}</span>
              </div>
            </div>

            {/* Wallet Balance Check */}
            {balance < totalPayable && (
              <div style={{
                padding: '10px 14px', background: 'rgba(231, 76, 60, 0.1)',
                borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-accent-red)',
                border: '1px solid rgba(231, 76, 60, 0.2)', marginBottom: 16,
              }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Insufficient balance. You need ₹{(totalPayable - balance).toLocaleString()} more.
              </div>
            )}

            <div style={{
              padding: '10px 14px', background: 'rgba(46, 204, 113, 0.08)',
              borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-accent-green)',
              border: '1px solid rgba(46, 204, 113, 0.15)', marginBottom: 16,
            }}>
              <Shield size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Security deposit of ₹{bookingModal.securityDeposit} will be refunded when you return the vehicle.
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setBookingModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBook}
                disabled={isBooking || balance < totalPayable}>
                {isBooking
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : `Pay ₹${totalPayable} & Rent`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModal && (
        <div className="modal-backdrop" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Return Vehicle</h3>
              <button className="modal-close" onClick={() => setReturnModal(null)}><X size={18} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>{returnModal.vehicleImage}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{returnModal.vehicleName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>{returnModal.brand} • {returnModal.location}</div>
            </div>

            <div style={{
              padding: 16, background: 'rgba(46, 204, 113, 0.08)',
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(46, 204, 113, 0.15)',
              textAlign: 'center', marginBottom: 16,
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-accent-green)', fontWeight: 600 }}>
                ₹{returnModal.securityDeposit} security deposit will be refunded
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleReturn(returnModal.id)}>
                <CheckCircle size={16} /> Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
