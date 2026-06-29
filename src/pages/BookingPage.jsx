import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Car, User, Heart, CreditCard, Luggage,
  CheckCircle, ArrowRight, AlertCircle, Wallet, Shield
} from 'lucide-react';
import { useBookingStore, useVehicleStore, useWalletStore, useAuthStore, useToastStore, useAgentStore, usePlatformStore } from '../store';
import { supabase } from '../supabaseClient';

export default function BookingPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { routes, fetchAllRoutes, createBooking } = useBookingStore();
  const { vehicles } = useVehicleStore();
  const { balance } = useWalletStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { currentAgent, addAgentBooking } = useAgentStore();

  useEffect(() => {
    if (routes.length === 0 && fetchAllRoutes) {
      fetchAllRoutes();
    }
  }, [routes.length, fetchAllRoutes]);

  const route = routes.find(r => r.id === routeId);
  const vehicle = route ? vehicles.find(v => v.id === route.vehicleId) : null;

  const [step, setStep] = useState(1); // 1: details, 2: luggage, 3: summary, 4: confirmed
  const [passengers, setPassengers] = useState([{
    id: Date.now(),
    name: user?.name || '',
    age: '',
    bloodGroup: user?.bloodGroup || '',
    gender: 'male',
    address: '',
    phone: user?.phone || '',
    email: user?.email || '',
    idType: 'aadhar',
    idNumber: '',
  }]);
  const [totalLuggageKg, setTotalLuggageKg] = useState(10);
  const [isBooking, setIsBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [customerPaymentMode, setCustomerPaymentMode] = useState('cash');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCode, setPromoCode] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const updatePassenger = (id, field, value) => {
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPassenger = () => {
    if (passengers.length >= 20) {
      addToast('Maximum 20 passengers allowed per booking', 'warning');
      return;
    }
    setPassengers(prev => [...prev, {
      id: Date.now(), name: '', age: '', bloodGroup: '', gender: 'male', address: '', phone: '', email: '', idType: 'aadhar', idNumber: ''
    }]);
  };

  const removePassenger = (id) => {
    if (passengers.length <= 1) return;
    setPassengers(prev => prev.filter(p => p.id !== id));
  };

  if (!route || !vehicle) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><AlertCircle size={36} /></div>
        <h3>Trip Not Found</h3>
        <p>This trip may no longer be available.</p>
        <button className="btn btn-primary" onClick={() => navigate('/search')}>Search Trips</button>
      </div>
    );
  }

  const isAgent = user?.role === 'agent';
  
  const calculatePassengerPrice = (ageStr) => {
    const age = parseInt(ageStr) || 0;
    if (age > 0 && age <= 5) return 0;
    if (age >= 6 && age <= 7) return Math.round(route.price / 2);
    return route.price;
  };

  const totalTicketPrice = passengers.reduce((sum, p) => sum + calculatePassengerPrice(p.age), 0);
  const freeLuggageLimit = passengers.length * 15;
  const extraLuggage = Math.max(0, totalLuggageKg - freeLuggageLimit);
  const luggageCost = extraLuggage * 10;
  
  const baseTotal = totalTicketPrice + luggageCost;
  const commissionRate = (usePlatformStore.getState().settings?.agent_commission_rate || 5) / 100;
  const commissionAmount = isAgent ? Math.round(baseTotal * commissionRate) : 0;
  
  let totalAmount = baseTotal + commissionAmount;
  let discountAmount = 0;
  if (promoDiscount > 0) {
    discountAmount = Math.round((totalAmount * promoDiscount) / 100);
    totalAmount -= discountAmount;
  }

  const handleBook = async () => {
    setIsBooking(true);
    const result = await createBooking(routeId, passengers, totalLuggageKg, isAgent, currentAgent?.id, customerPaymentMode, promoDiscount, promoCode);
    setIsBooking(false);

    if (result && result.error) {
      addToast(result.error, 'error');
    } else if (result) {
      if (isAgent) addAgentBooking(result);
      setConfirmedBooking(result);
      setStep(4);
      addToast('Booking confirmed! 🎉', 'success');
      setTimeout(() => {
        addToast(`📧 Ticket copy sent to ${passengers[0].email}`, 'success');
      }, 1500);
    } else {
      addToast('Failed to create booking', 'error');
    }
  };

  // Step 4: Confirmation
  if (step === 4 && confirmedBooking) {
    return (
      <div className="animate-scale-in" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(46, 204, 113, 0.15)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={48} color="var(--color-accent-green)" />
        </div>
        <h2 style={{ marginBottom: 8 }}>Booking Confirmed! 🎉</h2>
        <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 32 }}>
          Your ticket has been booked successfully.
        </p>

        <div className="booking-summary">
          <div className="booking-summary-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Booking ID</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{confirmedBooking.id}</div>
              </div>
              <span className="badge badge-success" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                Confirmed
              </span>
            </div>
          </div>
          <div className="booking-summary-body">
            <div className="booking-summary-row">
              <span className="label">Route</span>
              <span className="value">{route.from} → {route.to}</span>
            </div>
            <div className="booking-summary-row">
              <span className="label">Date</span>
              <span className="value">{route.date}</span>
            </div>
            <div className="booking-summary-row">
              <span className="label">Time</span>
              <span className="value">{route.departureTime} → {route.arrivalTime}</span>
            </div>
            <div className="booking-summary-row">
              <span className="label">Vehicle</span>
              <span className="value">{vehicle.type} • {vehicle.registrationNumber}</span>
            </div>
            <div className="booking-summary-row">
              <span className="label">Passengers</span>
              <span className="value">{confirmedBooking.passengerDetails.length} Person(s)</span>
            </div>
            <div className="booking-summary-row">
              <span className="label">Luggage</span>
              <span className="value">{confirmedBooking.luggageKg}kg {extraLuggage > 0 ? `(+${extraLuggage}kg extra)` : '(within free limit)'}</span>
            </div>
            {isAgent && (
              <div className="booking-summary-row">
                <span className="label">Agent Commission (5%)</span>
                <span className="value text-amber">₹{commissionAmount}</span>
              </div>
            )}
            <div className="booking-summary-total">
              <span>Total Paid</span>
              <span className="value">₹{confirmedBooking.totalAmount}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>
            View My Bookings
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>
            Book Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Book Your Trip</h1>
        <p>{route.from} → {route.to} • {route.date}</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['Passenger Details', 'Luggage', 'Summary & Pay'].map((label, i) => (
          <div key={label} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step > i + 1 ? 'var(--color-accent-green)' : step === i + 1 ? 'var(--gradient-primary)' : 'var(--color-surface-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: step >= i + 1 ? 'white' : 'var(--color-text-tertiary)',
              fontWeight: 700, fontSize: '0.875rem',
              transition: 'all 300ms ease',
            }}>
              {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 500,
              color: step === i + 1 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'
            }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Main Form */}
        <div>
          {step === 1 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <User size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                  Passenger Details
                </div>
                {passengers.length < 20 && (
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={addPassenger}>
                    + Add Passenger
                  </button>
                )}
              </h3>

              {isAgent && (
                <div style={{
                  background: 'rgba(244, 162, 97, 0.1)', borderRadius: 'var(--radius-md)',
                  padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid rgba(244, 162, 97, 0.2)',
                }}>
                  <Shield size={16} color="var(--color-accent-amber)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-accent-amber)' }}>
                    Booking as Agent — 5% commission will be applied
                  </span>
                </div>
              )}

              {passengers.map((p, idx) => (
                <div key={p.id} style={{
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  padding: 16, marginBottom: 16, background: 'var(--color-surface)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontWeight: 600, margin: 0 }}>Passenger {idx + 1}</h4>
                    {passengers.length > 1 && (
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-accent-red)' }}
                        onClick={() => removePassenger(p.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Full Name (First Middle Last)</label>
                    <input className="form-input" placeholder="e.g. Rahul Kumar Sharma"
                      value={p.name} onChange={e => updatePassenger(p.id, 'name', e.target.value)} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Age</label>
                      <input type="number" className="form-input" placeholder="Age" min={1} max={120}
                        value={p.age} onChange={e => updatePassenger(p.id, 'age', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select className="form-select" value={p.gender}
                        onChange={e => updatePassenger(p.id, 'gender', e.target.value)}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Blood Group</label>
                      <select className="form-select" value={p.bloodGroup}
                        onChange={e => updatePassenger(p.id, 'bloodGroup', e.target.value)}>
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg =>
                          <option key={bg} value={bg}>{bg}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" placeholder="Full Address"
                      value={p.address} onChange={e => updatePassenger(p.id, 'address', e.target.value)} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Mobile Number</label>
                      <input type="tel" className="form-input" placeholder="10-digit mobile"
                        value={p.phone} onChange={e => updatePassenger(p.id, 'phone', e.target.value)} maxLength={10} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address (for ticket copy)</label>
                      <input type="email" className="form-input" placeholder="user@example.com"
                        value={p.email} onChange={e => updatePassenger(p.id, 'email', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-divider" style={{ margin: '12px 0' }} />

                  <div className="form-group">
                    <label className="form-label">ID Type</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[{ id: 'aadhar', label: 'Aadhar' }, { id: 'pan', label: 'PAN' }].map(opt => (
                        <button key={opt.id}
                          className={`btn ${p.idType === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => updatePassenger(p.id, 'idType', opt.id)}
                          style={{ flex: 1, padding: '8px' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{p.idType === 'aadhar' ? 'Aadhar Number' : 'PAN Number'}</label>
                    <div className="form-input-icon-wrapper">
                      <CreditCard className="form-input-icon" size={20} />
                      <input className="form-input"
                        placeholder={p.idType === 'aadhar' ? 'XXXX XXXX XXXX' : 'ABCDE1234F'}
                        value={p.idNumber}
                        onChange={e => updatePassenger(p.id, 'idNumber', e.target.value)}
                        maxLength={p.idType === 'aadhar' ? 14 : 10}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button className="btn btn-primary btn-lg btn-full" onClick={() => {
                for (const p of passengers) {
                  if (!p.name || !p.age || !p.idNumber || !p.address || !p.phone || !p.email) {
                    addToast('All fields (Name, Age, Address, Phone, Email, ID) are mandatory for all passengers.', 'error');
                    return;
                  }
                  if (!/^[a-zA-Z]+(\s+[a-zA-Z]+){2,}$/.test(p.name.trim())) {
                    addToast(`Please enter the full name (First, Middle, and Last name) for ${p.name || 'passenger'}.`, 'error');
                    return;
                  }
                  if (!/^\d{10}$/.test(p.phone.replace(/\D/g, ''))) {
                    addToast(`Phone number for ${p.name || 'passenger'} must be exactly 10 digits.`, 'error');
                    return;
                  }
                  if (p.idType === 'aadhar' && !/^\d{12}$/.test(p.idNumber.replace(/\D/g, ''))) {
                    addToast(`Aadhar number for ${p.name || 'passenger'} must be exactly 12 digits.`, 'error');
                    return;
                  }
                  if (p.idType === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]$/.test(p.idNumber.toUpperCase())) {
                    addToast(`Invalid PAN format for ${p.name || 'passenger'}. Expected format: ABCDE1234F`, 'error');
                    return;
                  }
                }
                setStep(2);
              }} style={{ marginTop: 8 }}>
                Continue to Luggage →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                <Luggage size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Luggage Details
              </h3>

              <div style={{
                background: 'rgba(46, 204, 113, 0.1)', borderRadius: 'var(--radius-md)',
                padding: '16px', marginBottom: 20, border: '1px solid rgba(46, 204, 113, 0.2)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--color-accent-green)', marginBottom: 4 }}>
                  ✓ {freeLuggageLimit}kg Free Luggage Included ({passengers.length} × 15kg)
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                  Extra luggage at ₹10/kg. Vehicle capacity: {route.luggageAvailable}kg available.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Luggage Weight (kg)</label>
                <input type="range" min={0} max={Math.min(route.luggageAvailable, passengers.length * 60)}
                  value={totalLuggageKg}
                  onChange={e => setTotalLuggageKg(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent-teal)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="text-muted">0 kg</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: totalLuggageKg > freeLuggageLimit ? 'var(--color-accent-amber)' : 'var(--color-accent-green)' }}>
                    {totalLuggageKg} kg
                  </span>
                  <span className="text-muted">{Math.min(route.luggageAvailable, passengers.length * 60)} kg</span>
                </div>
              </div>

              {extraLuggage > 0 && (
                <div style={{
                  background: 'rgba(244, 162, 97, 0.1)', borderRadius: 'var(--radius-md)',
                  padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                  border: '1px solid rgba(244, 162, 97, 0.2)',
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-accent-amber)' }}>
                    Extra luggage: {extraLuggage}kg × ₹10
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent-amber)' }}>
                    +₹{luggageCost}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep(3)}>
                  Review Summary →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                <CheckCircle size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Review & Pay
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>Passengers</div>
                  {passengers.map((p, i) => (
                    <div key={p.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{i + 1}. {p.name} • Age {p.age} • {p.bloodGroup}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                        {p.idType.toUpperCase()}: {p.idNumber}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Luggage</div>
                  <div style={{ fontWeight: 600 }}>
                    {totalLuggageKg}kg total • {freeLuggageLimit}kg free
                    {extraLuggage > 0 && ` • ${extraLuggage}kg extra (₹${luggageCost})`}
                  </div>
                </div>
              </div>

              {/* PROMO CODE SECTION */}
              <div style={{ marginTop: 12, padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Have a Promo Code?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="form-input" style={{ flex: 1, textTransform: 'uppercase' }} placeholder="Enter code" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} disabled={promoCode !== null} />
                  {promoCode ? (
                    <button className="btn btn-secondary" onClick={() => { setPromoCode(null); setPromoDiscount(0); setPromoCodeInput(''); }}>Remove</button>
                  ) : (
                    <button className="btn btn-primary" onClick={async () => {
                      if (!promoCodeInput) return;
                      const { data, error } = await supabase.from('promo_codes').select('*').eq('code', promoCodeInput).eq('is_active', true).single();
                      if (error || !data || data.current_uses >= data.max_uses || (data.expires_at && new Date(data.expires_at) < new Date())) {
                        addToast('Invalid, expired, or fully used promo code', 'error');
                      } else {
                        setPromoDiscount(data.discount_percent);
                        setPromoCode(promoCodeInput);
                        addToast(`${data.discount_percent}% discount applied!`, 'success');
                      }
                    }}>Apply</button>
                  )}
                </div>
              </div>

              <div className="form-divider" />

              {/* Customer Payment Method (Agent Only) */}
              {isAgent && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Customer Payment Method</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className={`btn ${customerPaymentMode === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCustomerPaymentMode('cash')} style={{ flex: 1 }}>
                      💵 Cash
                    </button>
                    <button className={`btn ${customerPaymentMode === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCustomerPaymentMode('upi')} style={{ flex: 1 }}>
                      📱 UPI
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 8 }}>
                    Note: Your platform wallet will be deducted by ₹{totalAmount}, but this logs how the customer paid you.
                  </p>
                </div>
              )}

              {/* Payment Method */}
              <div style={{
                padding: 16, background: 'rgba(27, 153, 139, 0.08)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(27, 153, 139, 0.2)', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <Wallet size={24} color="var(--color-accent-teal-light)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Pay via Wallet</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                    Balance: ₹{balance.toLocaleString()}
                  </div>
                </div>
                {balance >= totalAmount ? (
                  <span className="badge badge-success">Sufficient</span>
                ) : (
                  <span className="badge badge-danger">Low Balance</span>
                )}
              </div>

              {balance < totalAmount && (
                <div style={{
                  marginTop: 12, padding: '12px 16px', background: 'rgba(231, 76, 60, 0.1)',
                  borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-accent-red)',
                  border: '1px solid rgba(231, 76, 60, 0.2)',
                }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Insufficient wallet balance. Please add ₹{(totalAmount - balance).toLocaleString()} to your wallet.
                  <button className="btn btn-sm btn-accent" style={{ marginLeft: 8 }}
                    onClick={() => navigate('/wallet')}>
                    Add Money
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary btn-lg btn-full" onClick={handleBook}
                  disabled={isBooking || balance < totalAmount}>
                  {isBooking ? (
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  ) : (
                    <>Pay ₹{totalAmount} & Confirm</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div>
          <div className="booking-summary" style={{ position: 'sticky', top: 24 }}>
            <div className="booking-summary-header">
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>Trip Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9, fontSize: '0.875rem' }}>
                <span>{route.from}</span>
                <ArrowRight size={14} />
                <span>{route.to}</span>
              </div>
            </div>
            <div className="booking-summary-body">
              <div className="booking-summary-row">
                <span className="label"><Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />Date</span>
                <span className="value">{route.date}</span>
              </div>
              <div className="booking-summary-row">
                <span className="label"><Clock size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />Time</span>
                <span className="value">{route.departureTime} - {route.arrivalTime}</span>
              </div>
              <div className="booking-summary-row">
                <span className="label"><Car size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />Vehicle</span>
                <span className="value">{vehicle.type}</span>
              </div>
              <div className="booking-summary-row">
                <span className="label">Reg. No.</span>
                <span className="value" style={{ fontSize: '0.75rem' }}>{vehicle.registrationNumber}</span>
              </div>
              {route.stops.length > 0 && (
                <div className="booking-summary-row">
                  <span className="label">Stops</span>
                  <span className="value" style={{ fontSize: '0.75rem' }}>{route.stops.join(', ')}</span>
                </div>
              )}

              <div className="form-divider" />

              <div className="booking-summary-row">
                <span className="label">Tickets ({passengers.length})</span>
                <span className="value">₹{totalTicketPrice}</span>
              </div>
              {luggageCost > 0 && (
                <div className="booking-summary-row">
                  <span className="label">Extra Luggage</span>
                  <span className="value text-amber">₹{luggageCost}</span>
                </div>
              )}
              {isAgent && (
                <div className="booking-summary-row">
                  <span className="label">Agent Fee (5%)</span>
                  <span className="value text-amber">₹{commissionAmount}</span>
                </div>
              )}
              <div className="booking-summary-total">
                <span>Total</span>
                <span className="value">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
