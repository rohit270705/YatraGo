import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Truck, Clock, CheckCircle, ArrowRight,
  Search, ShieldCheck, Sparkles, Navigation, ChevronRight,
  DollarSign, FileText, Box, Check, Info, Phone, User,
  Building2, Zap, Calendar, Award, RefreshCw, X
} from 'lucide-react';
import { useParcelStore, useWalletStore, useToastStore, useAuthStore } from '../store';
import { useAuthGate } from '../hooks/useAuthGate';
import DashboardHeader from '../components/DashboardHeader';
import LiveStatusCard from '../components/LiveStatusCard';

export default function ParcelPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { balance } = useWalletStore();
  const addToast = useToastStore(s => s.addToast);
  const gate = useAuthGate();
  const {
    parcels, fetchParcels, getDeliveryTiers,
    createParcelDelivery, trackShipment, activeTracking,
    isTrackingLoading
  } = useParcelStore();

  const [activeMainTab, setActiveMainTab] = useState('send'); // 'send' | 'track' | 'history'
  const [shipmentMode, setShipmentMode] = useState('personal'); // 'personal' | 'business' | 'same_city'

  // Booking Form State
  const [step, setStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedSize, setSelectedSize] = useState('small');
  const [weightKg, setWeightKg] = useState(2);
  const [selectedTier, setSelectedTier] = useState('relay'); // 'relay' | 'express' | 'scheduled' | third_party
  const [thirdPartyCourier, setThirdPartyCourier] = useState(null);

  const [formData, setFormData] = useState({
    pickup: 'Mumbai',
    dropoff: 'Pune',
    pickupAddress: 'Andheri West, Mumbai',
    dropAddress: 'FC Road, Pune',
    senderName: user?.name || '',
    senderPhone: user?.phone || '',
    receiverName: '',
    receiverPhone: '',
    declaredValue: 1000,
    specialNotes: '',
  });

  // Quick Tools Modal States (Blue Dart Pattern)
  const [showPriceFinder, setShowPriceFinder] = useState(false);
  const [showHubFinder, setShowHubFinder] = useState(false);
  const [calcFrom, setCalcFrom] = useState('Mumbai');
  const [calcTo, setCalcTo] = useState('Pune');
  const [calcWeight, setCalcWeight] = useState(3);

  // Tracking Search Input (Delhivery Pattern)
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  const updateForm = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  // Live Tier Calculations (Borzo + Shiprocket pattern)
  const tierData = getDeliveryTiers(formData.pickup, formData.dropoff, weightKg, selectedSize);
  const activeTierObj = tierData.tiers.find(t => t.id === selectedTier) || tierData.tiers[0];
  const finalPrice = thirdPartyCourier
    ? (tierData.thirdPartyCouriers.find(c => c.id === thirdPartyCourier)?.price || activeTierObj.price)
    : activeTierObj.price;

  // Porter Size Options
  const sizeTiles = [
    { id: 'document', emoji: '📄', label: 'Document', spec: 'Up to 0.5 kg' },
    { id: 'small', emoji: '📦', label: 'Small Box', spec: '1 – 5 kg' },
    { id: 'medium', emoji: '🧳', label: 'Medium Box', spec: '5 – 15 kg' },
    { id: 'large', emoji: '🚚', label: 'Large / Carton', spec: '15 – 50 kg' },
  ];

  // Quick Hub List (Blue Dart Pattern)
  const partnerHubs = [
    { city: 'Mumbai', address: 'Dadar T.T. Circle & CSMT Transit Hub', timings: 'Open 24/7' },
    { city: 'Pune', address: 'Swargate Terminal & Viman Nagar Hub', timings: '6:00 AM - 11:00 PM' },
    { city: 'Nashik', address: 'CBS Central Bus Station Desk', timings: '7:00 AM - 10:00 PM' },
    { city: 'Surat', address: 'Railway Station Road Cargo Center', timings: 'Open 24/7' },
  ];

  const handleCreateBooking = async () => {
    if (!formData.receiverName || !formData.receiverPhone) {
      addToast('Please provide recipient name and phone number', 'error');
      return;
    }
    if (balance < finalPrice) {
      addToast(`Insufficient wallet balance (₹${balance}). Please top up ₹${finalPrice - balance} more.`, 'error');
      return;
    }

    setIsBooking(true);
    const result = await createParcelDelivery({
      ...formData,
      pickup: formData.pickupAddress || formData.pickup,
      dropoff: formData.dropAddress || formData.dropoff,
      weight: weightKg,
      size: selectedSize,
      tier: selectedTier,
      thirdPartyCourier: thirdPartyCourier,
      price: finalPrice,
    });
    setIsBooking(false);

    if (result.success) {
      addToast(`🎉 Parcel booked successfully! Tracking ID: ${result.parcel.id}`, 'success');
      setActiveMainTab('history');
      setStep(1);
    } else {
      addToast(result.error || 'Failed to book parcel. Try again.', 'error');
    }
  };

  const handleTrackSubmit = (e) => {
    e?.preventDefault();
    if (!trackingInput.trim()) {
      addToast('Enter a tracking ID or phone number', 'error');
      return;
    }
    trackShipment(trackingInput);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60 }}>
      <DashboardHeader subtitle="Logistics &amp; Express Courier — Powered by Yaara Parcel Relay" />

      {/* ── TOP UTILITY & NAVIGATION BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {/* Main Section Switcher */}
        <div className="tabs" style={{ margin: 0, minWidth: 320 }}>
          <button className={`tab ${activeMainTab === 'send' ? 'active' : ''}`} onClick={() => setActiveMainTab('send')}>
            📦 Send Parcel
          </button>
          <button className={`tab ${activeMainTab === 'track' ? 'active' : ''}`} onClick={() => setActiveMainTab('track')}>
            🔍 Universal Tracker
          </button>
          <button className={`tab ${activeMainTab === 'history' ? 'active' : ''}`} onClick={() => setActiveMainTab('history')}>
            📋 My Shipments ({parcels.length})
          </button>
        </div>

        {/* Blue Dart Quick Utility Tools Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPriceFinder(true)}>
            <Clock size={14} /> Transit &amp; Rate Finder
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowHubFinder(true)}>
            <MapPin size={14} /> Drop Hubs
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          TAB 1: SEND A PARCEL
         ═══════════════════════════════════════════════════ */}
      {activeMainTab === 'send' && (
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          {/* CGL Shipment Mode Switcher */}
          <div className="logistics-mode-tabs">
            <button
              className={`logistics-mode-tab ${shipmentMode === 'personal' ? 'active' : ''}`}
              onClick={() => setShipmentMode('personal')}
            >
              <User size={15} /> Personal Courier
            </button>
            <button
              className={`logistics-mode-tab ${shipmentMode === 'same_city' ? 'active' : ''}`}
              onClick={() => setShipmentMode('same_city')}
            >
              <Zap size={15} /> Same-City Quick
            </button>
            <button
              className={`logistics-mode-tab ${shipmentMode === 'business' ? 'active' : ''}`}
              onClick={() => setShipmentMode('business')}
            >
              <Building2 size={15} /> Business &amp; Bulk
            </button>
          </div>

          {/* ── STEP 1: ROUTE & PARCEL SIZING (Porter Pattern) ── */}
          {step === 1 && (
            <div className="glass-card animate-slide-up" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>
                    📍 Pickup &amp; Drop Locations
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Enter city and addresses to calculate route and relay capacity
                  </p>
                </div>
                <span className="badge badge-teal">Step 1 of 2</span>
              </div>

              {/* City Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Pickup City</label>
                  <input
                    className="form-input"
                    value={formData.pickup}
                    onChange={e => updateForm('pickup', e.target.value)}
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery City</label>
                  <input
                    className="form-input"
                    value={formData.dropoff}
                    onChange={e => updateForm('dropoff', e.target.value)}
                    placeholder="e.g. Pune"
                  />
                </div>
              </div>

              {/* Exact Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Sender Address / Locality</label>
                  <input
                    className="form-input"
                    value={formData.pickupAddress}
                    onChange={e => updateForm('pickupAddress', e.target.value)}
                    placeholder="House / Flat No., Landmark, Locality"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Address / Locality</label>
                  <input
                    className="form-input"
                    value={formData.dropAddress}
                    onChange={e => updateForm('dropAddress', e.target.value)}
                    placeholder="Office / Flat No., Landmark, Locality"
                  />
                </div>
              </div>

              {/* Porter Style 4 Size Tiles */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                  Select Parcel Size (Porter Pattern)
                </label>
                <div className="size-tiles-grid">
                  {sizeTiles.map(tile => (
                    <div
                      key={tile.id}
                      className={`size-tile ${selectedSize === tile.id ? 'active' : ''}`}
                      onClick={() => setSelectedSize(tile.id)}
                    >
                      <div className="size-tile-emoji">{tile.emoji}</div>
                      <div className="size-tile-label">{tile.label}</div>
                      <div className="size-tile-spec">{tile.spec}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight Range Slider */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label">Weight (Kilograms)</label>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent-teal)' }}>
                    {weightKg} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="40"
                  step="0.5"
                  value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent-teal)' }}
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setStep(2)}
              >
                Choose Delivery Speed &amp; Tier →
              </button>
            </div>
          )}

          {/* ── STEP 2: SPEED TIERS & SENDER/RECEIVER DETAILS ── */}
          {step === 2 && (
            <div className="glass-card animate-slide-up" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>
                    ⚡ Choose Speed Tier &amp; Carrier
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Compare Yaara Relay vs. Dedicated Express and Third-Party Couriers
                  </p>
                </div>
                <span className="badge badge-teal">Step 2 of 2</span>
              </div>

              {/* Borzo 3-Tier Delivery Cards */}
              <div className="logistics-tier-grid">
                {tierData.tiers.map(tier => {
                  const isSelected = selectedTier === tier.id && !thirdPartyCourier;
                  return (
                    <div
                      key={tier.id}
                      className={`logistics-tier-card ${tier.isRelay ? 'relay-tier' : ''} ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedTier(tier.id);
                        setThirdPartyCourier(null);
                      }}
                    >
                      <div>
                        <div className={`tier-badge-pill ${tier.isRelay ? 'relay' : ''}`}>
                          {tier.badge}
                        </div>
                        <div className="tier-name">{tier.name}</div>
                        <div className="tier-tagline">{tier.tagline}</div>
                        {tier.co2Saved && (
                          <div className="tier-co2-badge">
                            🌱 {tier.co2Saved} saved
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="tier-price-row">
                          <span className="tier-price-val">₹{tier.price}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>all inclusive</span>
                        </div>
                        <div className="tier-eta-tag">⏱️ {tier.eta}</div>
                        <ul className="tier-highlights-list">
                          {tier.highlights.map((h, i) => (
                            <li key={i}>
                              <Check size={12} color="var(--color-accent-teal)" /> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shiprocket Fallback Courier Comparison Strip */}
              <div className="fallback-courier-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                    🤝 Multi-Courier Partner Network (Shiprocket Pattern)
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    Guaranteed fallback for all PIN codes
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tierData.thirdPartyCouriers.map(partner => (
                    <div
                      key={partner.id}
                      className="fallback-courier-row"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: thirdPartyCourier === partner.id ? 'rgba(27, 153, 139, 0.12)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setThirdPartyCourier(partner.id);
                        setSelectedTier('third_party');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="courier"
                          checked={thirdPartyCourier === partner.id}
                          onChange={() => {}}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{partner.name}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                            ETA: {partner.eta} • Rating: ⭐ {partner.rating}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--color-accent-teal)' }}>
                        ₹{partner.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>
                  👤 Recipient &amp; Security Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Recipient Name *</label>
                    <input
                      className="form-input"
                      placeholder="Receiver's full name"
                      value={formData.receiverName}
                      onChange={e => updateForm('receiverName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recipient Phone (For Delivery OTP) *</label>
                    <input
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={formData.receiverPhone}
                      onChange={e => updateForm('receiverPhone', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Sender Phone *</label>
                    <input
                      className="form-input"
                      placeholder="Your contact number"
                      value={formData.senderPhone}
                      onChange={e => updateForm('senderPhone', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Declared Item Value (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={formData.declaredValue}
                      onChange={e => updateForm('declaredValue', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Price Summary & Wallet Payment */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                marginBottom: 20,
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Selected Tier / Carrier</span>
                  <span style={{ fontWeight: 700 }}>
                    {thirdPartyCourier
                      ? tierData.thirdPartyCouriers.find(c => c.id === thirdPartyCourier)?.name
                      : activeTierObj.name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Wallet Balance</span>
                  <span style={{ fontWeight: 700 }}>₹{Number(balance).toLocaleString('en-IN')}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                }}>
                  <span>Payable via YatraGo Wallet</span>
                  <span style={{ color: 'var(--color-accent-teal)' }}>₹{finalPrice}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => gate(handleCreateBooking, { type: 'parcel' })}
                  disabled={isBooking || (isAuthenticated && balance < finalPrice)}
                >
                  {isBooking ? 'Processing Booking...' : `Confirm & Pay ₹${finalPrice}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 2: UNIVERSAL TRACKER (Delhivery Pattern)
         ═══════════════════════════════════════════════════ */}
      {activeMainTab === 'track' && (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="universal-tracker-box">
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>
              🔍 Universal Shipment Tracker
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Track any shipment by Order ID (PRC-...), Partner AWB, or Receiver Mobile Number.
            </p>

            <form onSubmit={handleTrackSubmit} className="tracker-search-bar">
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Enter Tracking ID (e.g. PRC-DEMO89) or mobile number..."
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={isTrackingLoading}>
                <Search size={16} /> {isTrackingLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {/* Tracking Results & Timeline */}
            {activeTracking && (
              <div style={{ marginTop: 24 }} className="animate-slide-up">
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(27, 153, 139, 0.08)',
                  border: '1px solid rgba(27, 153, 139, 0.25)',
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Shipment ID</div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.04em' }}>
                      {activeTracking.id}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {activeTracking.pickup_label} ➔ {activeTracking.drop_label}
                    </div>
                  </div>

                  {activeTracking.otp_code && (
                    <div style={{
                      background: 'var(--color-surface)',
                      border: '1px dashed var(--color-accent-amber)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-accent-amber)', fontWeight: 800 }}>
                        DELIVERY OTP
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.15em' }}>
                        {activeTracking.otp_code}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Steps Timeline */}
                <div className="tracker-steps-timeline">
                  {activeTracking.timeline?.map((evt, idx) => (
                    <div
                      key={idx}
                      className={`tracker-step-node ${evt.completed ? 'completed' : ''} ${evt.status === activeTracking.status ? 'current' : ''}`}
                    >
                      <div className="tracker-step-dot">
                        {evt.completed ? '✓' : idx + 1}
                      </div>
                      <div className="tracker-step-label">{evt.label}</div>
                      <div className="tracker-step-desc">{evt.desc}</div>
                      {evt.time && (
                        <div className="tracker-step-time">
                          {new Date(evt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(evt.time).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3: SENDER'S SHIPMENT HISTORY
         ═══════════════════════════════════════════════════ */}
      {activeMainTab === 'history' && (
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          {parcels.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
              <h3 style={{ fontWeight: 800, marginBottom: 6 }}>No parcel shipments yet</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                Send items, documents, or luggage with Yaara Relay starting from just ₹110.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveMainTab('send')}>
                Send Your First Parcel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {parcels.map(p => (
                <div key={p.id} className="glass-card" style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.id}</span>
                      <span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>
                        {p.delivery_tier === 'relay' ? '✨ Yaara Relay' : p.delivery_tier}
                      </span>
                    </div>
                    <span className="badge badge-warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {p.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                    <MapPin size={16} color="var(--color-accent-teal)" />
                    <span>{p.pickup_label || p.pickup_address}</span>
                    <ArrowRight size={14} color="var(--color-text-tertiary)" />
                    <span>{p.drop_label || p.dropoff_address}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <div>
                      Recipient: <strong>{p.recipient_name}</strong> ({p.recipient_phone}) • {p.weight_kg} kg
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>
                        ₹{p.price_amount || p.price}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setTrackingInput(p.id);
                          trackShipment(p.id);
                          setActiveMainTab('track');
                        }}
                      >
                        Track Live →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: BLUE DART TRANSIT TIME & PRICE FINDER ── */}
      {showPriceFinder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: 16,
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>⏱️ Transit Time &amp; Price Finder</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPriceFinder(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Origin City</label>
              <input className="form-input" value={calcFrom} onChange={e => setCalcFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Destination City</label>
              <input className="form-input" value={calcTo} onChange={e => setCalcTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg): {calcWeight} kg</label>
              <input type="range" min="1" max="50" value={calcWeight} onChange={e => setCalcWeight(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ background: 'var(--color-surface)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                <span>Yaara Relay (Cheapest)</span>
                <strong>₹{Math.round(110 + calcWeight * 15)} • ~5h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Dedicated Express</span>
                <strong>₹{Math.round(260 + calcWeight * 25)} • ~2h</strong>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowPriceFinder(false)}>
              Close Calculator
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: BLUE DART DROP HUBS FINDER ── */}
      {showHubFinder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: 16,
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>📍 Verified Drop Hubs &amp; Depots</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHubFinder(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {partnerHubs.map((hub, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{hub.city}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{hub.address}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-teal)', marginTop: 2 }}>{hub.timings}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowHubFinder(false)}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
