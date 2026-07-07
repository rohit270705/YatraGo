import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, Shield, Calendar, MapPin, Users, ArrowRight, CheckCircle, AlertTriangle, Clock, Navigation, Sparkles, DollarSign, Send } from 'lucide-react';
import { useVehicleStore, useVehicleOfferStore, useToastStore, useAuthStore } from '../store';

export default function VehicleDetailPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { getVehicle } = useVehicleStore();
  const { createOffer } = useVehicleOfferStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  
  const vehicle = getVehicle(vehicleId);

  // Form state for Direct Booking Negotiation (Module 17)
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [distanceKm, setDistanceKm] = useState(200);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [driverIncluded, setDriverIncluded] = useState(true);
  const [customPriceEdited, setCustomPriceEdited] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerSubmitted, setOfferSubmitted] = useState(false);

  // Calculate base rate and system estimated price
  const baseRate = vehicle ? (vehicle.baseRate || (vehicle.type === 'SUV' ? 20 : vehicle.type === 'Sedan' ? 16 : vehicle.type === 'Mini Bus' ? 25 : vehicle.type === 'Bus' ? 40 : 15)) : 20;
  const systemEstimatedPrice = Math.max(500, (Number(distanceKm || 0) * baseRate) + (driverIncluded ? 500 : 0));
  
  const [proposedPrice, setProposedPrice] = useState(systemEstimatedPrice);

  useEffect(() => {
    if (!customPriceEdited) {
      setProposedPrice(systemEstimatedPrice);
    }
  }, [systemEstimatedPrice, customPriceEdited]);

  if (!vehicle) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Car size={36} /></div>
        <h3>Vehicle Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/vehicles')}>Back to Vehicles</button>
      </div>
    );
  }

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to send a price offer to the vehicle owner.', 'warning');
      navigate('/login');
      return;
    }
    if (!routeFrom || !routeTo || !travelDate) {
      addToast('Please enter origin, destination, and travel date.', 'warning');
      return;
    }
    if (!termsAccepted) {
      addToast('Please accept the Vehicle Direct Booking Terms & Conditions.', 'warning');
      return;
    }
    if (Number(proposedPrice) < 100) {
      addToast('Please enter a valid price offer.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await createOffer({
      vehicleId: vehicle.id,
      routeFrom: routeFrom.trim(),
      routeTo: routeTo.trim(),
      travelDate: travelDate,
      driverIncluded: driverIncluded,
      systemEstimatedPrice: systemEstimatedPrice,
      proposedPrice: Number(proposedPrice)
    });
    setIsSubmitting(false);

    if (res.success) {
      setOfferSubmitted(true);
      addToast(`Price offer of ₹${proposedPrice} sent to ${vehicle.ownerName}!`, 'success');
    } else {
      addToast(res.error || 'Failed to submit offer.', 'error');
    }
  };

  const getDocStatus = (doc) => {
    if (!doc?.validUntil) return { label: 'Unknown', class: 'badge-info', days: 0 };
    const expiry = new Date(doc.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expired', class: 'badge-danger', days: daysLeft };
    if (daysLeft < 30) return { label: `Expires in ${daysLeft}d`, class: 'badge-warning', days: daysLeft };
    return { label: 'Valid', class: 'badge-success', days: daysLeft };
  };

  const documents = [
    { name: 'PUC Certificate', data: vehicle.puc, icon: '📋' },
    { name: 'Driving License', data: vehicle.driverLicense, icon: '🪪' },
    { name: 'Insurance', data: vehicle.insurance, icon: '🛡️' },
  ];

  return (
    <div className="animate-fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/vehicles')} style={{ marginBottom: 16 }}>
        ← Back to Vehicles
      </button>

      {/* Vehicle Header */}
      <div className="glass-card" style={{ marginBottom: 24, padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-lg)',
            background: 'rgba(27, 153, 139, 0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Car size={36} color="var(--color-accent-teal-light)" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>{vehicle.registrationNumber}</h2>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              {vehicle.type} • {vehicle.seatingCapacity} seats • {vehicle.luggageCapacity}kg max luggage
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Owner: <strong>{vehicle.ownerName}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vehicle.approved
              ? <span className="badge badge-success"><CheckCircle size={12} /> Approved & Active</span>
              : <span className="badge badge-warning"><AlertTriangle size={12} /> Pending Approval</span>
            }
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/tracking')}>
              <Navigation size={14} /> Live Track
            </button>
          </div>
        </div>
      </div>

      {/* Direct Booking & Negotiable Price Offer Section (Module 17) */}
      <div className="glass-card animate-fade-in" style={{ marginBottom: 24, padding: 'var(--space-xl)', border: '2px solid rgba(27, 153, 139, 0.4)', background: 'linear-gradient(135deg, rgba(27, 153, 139, 0.08) 0%, rgba(30, 41, 59, 0.4) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0, color: '#fff' }}>Direct Vehicle Booking (Negotiable Pricing)</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Book this {vehicle.type} directly from owner <strong>{vehicle.ownerName}</strong>. Propose your own travel rate!
            </p>
          </div>
        </div>

        {offerSubmitted ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
            <CheckCircle size={48} color="var(--color-accent-green)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>Price Offer Submitted!</h4>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 500, margin: '0 auto 16px' }}>
              Your offer of <strong style={{ color: 'var(--color-accent-green)' }}>₹{Number(proposedPrice).toLocaleString()}</strong> for <strong>{routeFrom} → {routeTo}</strong> on <strong>{travelDate}</strong> has been sent to {vehicle.ownerName}.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => { setOfferSubmitted(false); setCustomPriceEdited(false); }}>Send Another Offer</button>
              <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>View My Bookings / Offers</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOfferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Route & Date Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} /> From City
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Mumbai"
                  value={routeFrom}
                  onChange={e => setRouteFrom(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} /> To City / Destination
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Pune / Mahabaleshwar"
                  value={routeTo}
                  onChange={e => setRouteTo(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Travel Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setTravelDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Distance & Driver Option Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 'var(--radius-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Estimated Roundtrip / Total Distance (km)
                </label>
                <input
                  type="number"
                  className="input"
                  min="10"
                  max="5000"
                  value={distanceKm}
                  onChange={e => {
                    setDistanceKm(e.target.value);
                    const val = Number(e.target.value) || 0;
                    if (!customPriceEdited) {
                      setProposedPrice(Math.max(500, (val * baseRate) + (driverIncluded ? 500 : 0)));
                    }
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  Owner Base Rate: ₹{baseRate}/km
                </span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Driver Preference
                </label>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: driverIncluded ? 'var(--color-accent-teal)' : 'var(--color-text)' }}>
                    <input
                      type="radio"
                      name="driverOpt"
                      checked={driverIncluded}
                      onChange={() => {
                        setDriverIncluded(true);
                        if (!customPriceEdited) {
                          setProposedPrice(Math.max(500, (Number(distanceKm) * baseRate) + 500));
                        }
                      }}
                    />
                    With Driver (+₹500 allowance)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: !driverIncluded ? 'var(--color-accent-teal)' : 'var(--color-text)' }}>
                    <input
                      type="radio"
                      name="driverOpt"
                      checked={!driverIncluded}
                      onChange={() => {
                        setDriverIncluded(false);
                        if (!customPriceEdited) {
                          setProposedPrice(Math.max(500, (Number(distanceKm) * baseRate)));
                        }
                      }}
                    />
                    Self Drive (No Driver)
                  </label>
                </div>
              </div>
            </div>

            {/* Pricing Estimation & Negotiation Box */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'rgba(27, 153, 139, 0.1)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-primary)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>System Estimated Price</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>₹{systemEstimatedPrice.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Based on {distanceKm}km @ ₹{baseRate}/km {driverIncluded ? '+ ₹500 driver allowance' : ''}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent-amber)', marginBottom: 4 }}>
                  <DollarSign size={14} style={{ display: 'inline' }} /> Your Proposed Price Offer (₹)
                </label>
                <input
                  type="number"
                  className="input"
                  style={{ fontSize: '1.25rem', fontWeight: 700, borderColor: 'var(--color-accent-amber)', color: 'var(--color-accent-amber)' }}
                  value={proposedPrice}
                  onChange={e => {
                    setProposedPrice(e.target.value);
                    setCustomPriceEdited(true);
                  }}
                  min="100"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Negotiable! Owner will accept or reject this exact amount.
                </span>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
              <input
                type="checkbox"
                id="termsCheck"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                required
              />
              <label htmlFor="termsCheck" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                I agree to the <strong>Vehicle Direct Booking Terms & Conditions</strong>. I understand that submitting this offer sends a binding request to the vehicle owner. If accepted, my booking will be confirmed at my proposed price.
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !termsAccepted} style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}>
              <Send size={18} /> Submit Price Offer to {vehicle.ownerName}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents */}
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            <Shield size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Document Verification
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {documents.map((doc, i) => {
              const status = getDocStatus(doc.data);
              return (
                <div key={i} className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '1.5rem' }}>{doc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        {doc.data?.number || 'N/A'}
                      </div>
                      {doc.data?.holder && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                          Holder: {doc.data.holder}
                        </div>
                      )}
                      {doc.data?.provider && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                          Provider: {doc.data.provider}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${status.class}`}>{status.label}</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        Expires: {doc.data?.validUntil || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Journey History */}
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Last 5 Journeys
          </h3>
          {(!vehicle.journeyHistory || vehicle.journeyHistory.length === 0) ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
              <p style={{ color: 'var(--color-text-tertiary)' }}>No journey history yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(vehicle.journeyHistory || []).slice(0, 5).map((journey, i) => (
                <div key={journey.id} className="glass-card" style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(46, 204, 113, 0.12)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-accent-green)', fontWeight: 700, fontSize: '0.75rem',
                    }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.9375rem' }}>
                        {journey.from} <ArrowRight size={14} color="var(--color-text-tertiary)" /> {journey.to}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: 12 }}>
                        <span><Calendar size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 2 }} /> {journey.date}</span>
                        <span><Users size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 2 }} /> {journey.passengers} passengers</span>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>
                      <CheckCircle size={10} /> {journey.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
