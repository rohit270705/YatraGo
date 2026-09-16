import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Car, User, Heart, CreditCard, Luggage,
  CheckCircle, ArrowRight, AlertCircle, Wallet, Shield, Ticket,
  ChevronDown, ChevronUp, FileText, Info, Accessibility, BadgePercent
} from 'lucide-react';
import { useBookingStore, useVehicleStore, useWalletStore, useAuthStore, useToastStore, useAgentStore, useGuestStore, usePlatformStore } from '../store';
import { useAuthGate } from '../hooks/useAuthGate';
import { supabase } from '../supabaseClient';
import {
  calcGst, isValidGstin, gstinStateCode, gstSplitType,
  generateInvoiceNumber, GST_STATE_CODES,
  SENIOR_CITIZEN_MIN_AGE_FEMALE, SENIOR_CITIZEN_MIN_AGE_MALE,
  TATKAL_DAYS_BEFORE_JOURNEY, TATKAL_SURCHARGE_PERCENT,
  YATRAGO_GSTIN,
} from '../data/gstRates';
import { TRAIN_CLASS_META } from './TrainsPage';

// ── Quota definitions ──────────────────────────────────────────────────────────
const QUOTA_INFO = {
  GENERAL:        { label: 'General',         icon: '🎫', desc: 'Standard booking — no special quota' },
  LADIES:         { label: 'Ladies',           icon: '♀️',  desc: 'Reserved seats for female passengers only' },
  SENIOR_CITIZEN: { label: 'Senior Citizen',   icon: '👴', desc: 'Lower-berth priority. ⚠️ No fare discount active as of 2024 (configurable).' },
  TATKAL:         { label: 'Tatkal',           icon: '⚡', desc: 'Urgent booking — premium surcharge applies' },
  PWD:            { label: 'PWD',              icon: '♿', desc: 'Persons with Disability — priority allocation' },
};

// ── Berth options by class ─────────────────────────────────────────────────────
const BERTH_OPTIONS_BY_CLASS = {
  SL:  ['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'],
  '3A':['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'],
  '3E':['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'],
  '2A':['Lower', 'Upper'],
  '1A':['Lower', 'Upper'],
};

function getBerthOptions(classCode) {
  return BERTH_OPTIONS_BY_CLASS[classCode] || null;
}

// ── Days until journey date ────────────────────────────────────────────────────
function daysUntilJourney(journeyDateStr) {
  if (!journeyDateStr) return null;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const journey = new Date(journeyDateStr); journey.setHours(0, 0, 0, 0);
  return Math.round((journey - today) / (1000 * 60 * 60 * 24));
}

// ── Quota selector component ───────────────────────────────────────────────────
function QuotaSelector({ quota, setQuota, availableQuotas }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.06em', marginBottom: 10 }}>
        BOOKING QUOTA
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {availableQuotas.map(q => {
          const info    = QUOTA_INFO[q];
          const active  = quota === q;
          return (
            <button key={q} onClick={() => setQuota(q)} className="btn" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 600,
              background: active ? 'rgba(27,153,139,0.18)' : 'var(--color-surface-elevated)',
              border: active ? '2px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)',
              color: active ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)',
            }}>
              <span>{info.icon}</span>
              {info.label}
              {active && <CheckCircle size={13} />}
            </button>
          );
        })}
      </div>
      {quota !== 'GENERAL' && (
        <div style={{
          marginTop: 10, fontSize: '0.78rem', color: 'var(--color-text-tertiary)',
          padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-accent-teal)', display: 'flex', gap: 6, alignItems: 'flex-start',
        }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          {QUOTA_INFO[quota]?.desc}
          {quota === 'TATKAL' && (
            <span style={{ color: 'var(--color-accent-amber)', fontWeight: 600 }}>
              {' '}+{TATKAL_SURCHARGE_PERCENT}% surcharge applied (approximate — verify IR circular).
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── GST Breakup Panel ──────────────────────────────────────────────────────────
function GstBreakupPanel({ baseFare, gstResult, luggageCost, commissionAmount, discountAmount, totalAmount, promoCode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16,
    }}>
      <div style={{ padding: '10px 16px', background: 'rgba(27,153,139,0.08)', borderBottom: '1px solid var(--color-border)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-accent-teal-light)', letterSpacing: '0.06em' }}>
        FARE BREAKUP
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Base Fare</span>
          <span style={{ fontWeight: 600 }}>₹{baseFare.toLocaleString('en-IN')}</span>
        </div>

        {gstResult.isExempt ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              GST
              <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>
                EXEMPT
              </span>
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>₹0</span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              GST <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>(@ {gstResult.gstPercent}%)</span>
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-accent-amber)' }}>₹{gstResult.gstAmount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {luggageCost > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Extra Luggage</span>
            <span style={{ fontWeight: 600 }}>₹{luggageCost.toLocaleString('en-IN')}</span>
          </div>
        )}

        {commissionAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Agent Commission</span>
            <span style={{ fontWeight: 600, color: 'var(--color-accent-amber)' }}>₹{commissionAmount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
            <span style={{ color: '#10b981' }}>Promo ({promoCode})</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>−₹{discountAmount.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '10px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem' }}>
          <span>Total Payable</span>
          <span>₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        {!gstResult.isExempt && (
          <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
            ⚠️ GST rates shown are indicative. Verify with CA/CBIC before production.
          </div>
        )}
      </div>
    </div>
  );
}

// ── GSTIN Invoice Panel ────────────────────────────────────────────────────────
function GstInvoicePanel({ gstin, setGstin, legalName, setLegalName, isEnabled, setIsEnabled, gstResult }) {
  const splitType  = gstin && isValidGstin(gstin) ? gstSplitType(gstin) : null;
  const stateCode  = gstin && isValidGstin(gstin) ? gstinStateCode(gstin) : '';
  const stateName  = GST_STATE_CODES[stateCode] || stateCode;
  const halfAmount = gstResult.isExempt ? 0 : Math.round(gstResult.gstAmount / 2);

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className="btn"
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', background: isEnabled ? 'rgba(27,153,139,0.08)' : 'var(--color-surface)',
          border: isEnabled ? '1.5px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', color: isEnabled ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)',
          fontWeight: 600, fontSize: '0.85rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={15} /> Add GST Invoice Details (Business Travel)
        </span>
        {isEnabled ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {isEnabled && (
        <div style={{
          marginTop: 8, padding: '14px 16px', background: 'var(--color-surface)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        }}>
          <div className="form-group">
            <label className="form-label">
              GSTIN <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(15 characters)</span>
            </label>
            <input
              className="form-input"
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={gstin}
              maxLength={15}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em' }}
              onChange={e => setGstin(e.target.value.toUpperCase())}
            />
            {gstin.length === 15 && !isValidGstin(gstin) && (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>
                Invalid GSTIN format. Expected: 2-digit state + 5-letter PAN + 4 digits + letter + 1 + Z + checksum
              </div>
            )}
            {isValidGstin(gstin) && (
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>✓ Valid GSTIN</span>
                <span>State: <strong>{stateName}</strong></span>
                <span style={{ fontWeight: 700, color: splitType === 'CGST_SGST' ? 'var(--color-accent-teal-light)' : 'var(--color-accent-amber)' }}>
                  {splitType === 'CGST_SGST'
                    ? `Intra-state → CGST ₹${halfAmount} + SGST ₹${halfAmount}`
                    : `Inter-state → IGST ₹${gstResult.gstAmount}`
                  }
                </span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Legal Business Name</label>
            <input
              className="form-input"
              placeholder="As registered with GST"
              value={legalName}
              onChange={e => setLegalName(e.target.value)}
            />
          </div>

          {gstResult.isExempt && (
            <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              This booking is GST-exempt. A tax invoice will be generated showing ₹0 tax with the exemption reason.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main BookingPage component ─────────────────────────────────────────────────
export default function BookingPage() {
  const { routeId } = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();
  const { routes, fetchAllRoutes, createBooking } = useBookingStore();
  const { vehicles, fareRates, fetchFareRates }    = useVehicleStore();
  const { balance }     = useWalletStore();
  const { addToast }    = useToastStore();
  const { user, isAuthenticated } = useAuthStore();
  const { currentAgent, addBooking: addAgentBooking } = useAgentStore();
  const gate            = useAuthGate();
  const { pendingAction, clearPendingAction } = useGuestStore();

  // ── Smart Resume: restore form state after guest logs in ─────────────────
  // When a guest filled in passenger details, hit Pay, got the login modal,
  // and successfully signed up/in — we re-populate the form so they don't lose work.
  useEffect(() => {
    if (
      isAuthenticated &&
      pendingAction?.type === 'booking' &&
      pendingAction?.payload?.passengers?.length
    ) {
      const saved = pendingAction.payload;
      if (saved.passengers) setPassengers(saved.passengers);
      if (saved.quota)      setQuota(saved.quota);
      if (saved.acceptedTC !== undefined) setAcceptedTC(saved.acceptedTC);
      // Don't clear pendingAction here — GuestLoginModal.resumeAndClose() will
      // call handleBook() via resumeFn, which needs pendingAction to still exist
      // for its own context. clearPendingAction() is called inside resumeAndClose.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!location.state?.isCab && routes.length === 0 && fetchAllRoutes) {
      fetchAllRoutes();
    }
  }, [routes.length, fetchAllRoutes, location.state]);

  const isCab     = location.state?.isCab;
  const isTransit = !!(location.state?.transitListing);
  const listing   = location.state?.transitListing || null;
  const mode      = listing?.mode || location.state?.mode || 'route';

  let route   = null;
  let vehicle = null;

  if (isTransit) {
    const modeLabel = { flight: '✈️ Flight', train: '🚂 Train', ferry: '🚢 Ferry' }[mode] || 'Transit';
    route = {
      id:              listing.id || routeId || 'transit-1',
      from:            listing.from,
      to:              listing.to,
      date:            new Date().toISOString().split('T')[0],
      departureTime:   listing.depart || 'See schedule',
      arrivalTime:     listing.arrive || listing.duration || 'See schedule',
      price:           listing.price || 0,
      luggageAvailable: 20,
      stops:           [],
    };
    vehicle = {
      type: `${modeLabel} — ${listing.classLabel || listing.travelClass || listing.listingType || ''}`,
      registrationNumber: listing.opCode || listing.operator || '',
    };
  } else if (isCab) {
    const cab = location.state?.route || {};
    route = {
      id:              cab.id || routeId || 'cab-1',
      from:            cab.from_city || 'Origin',
      to:              cab.to_city || 'Destination',
      date:            new Date().toISOString().split('T')[0],
      departureTime:   'Flexible',
      arrivalTime:     'Flexible',
      price:           cab.rate || 500,
      luggageAvailable: cab.luggage_available || 50,
      stops:           [],
    };
    vehicle = { type: 'Cab', registrationNumber: cab.vehicle_details || 'Assigned Driver Vehicle' };
  } else {
    route   = routes.find(r => String(r.id) === String(routeId));
    vehicle = route ? vehicles.find(v => String(v.id) === String(route.vehicleId || route.vehicle_id)) : null;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState([{
    id:           Date.now(),
    name:         user?.name || '',
    age:          '',
    bloodGroup:   user?.bloodGroup || '',
    gender:       'male',
    address:      '',
    phone:        user?.phone || '',
    email:        user?.email || '',
    idType:       'aadhar',
    idNumber:     '',
    berthPref:    '',
    isDisabled:   false,
  }]);
  const [totalLuggageKg,    setTotalLuggageKg]    = useState(10);
  const [isBooking,         setIsBooking]          = useState(false);
  const [confirmedBooking,  setConfirmedBooking]   = useState(null);
  const [customerPaymentMode, setCustomerPaymentMode] = useState('cash');
  const [promoCodeInput,    setPromoCodeInput]     = useState('');
  const [promoCode,         setPromoCode]          = useState(null);
  const [promoDiscount,     setPromoDiscount]      = useState(0);
  const [acceptedTC,        setAcceptedTC]         = useState(false);

  // Fare engine
  const [distanceKm, setDistanceKm] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!fareRates || fareRates.length === 0) {
      fetchFareRates();
    }
  }, [fetchFareRates, fareRates]);

  // Quota — train only
  const [quota, setQuota] = useState('GENERAL');

  // GSTIN invoice
  const [showGstInvoice, setShowGstInvoice] = useState(false);
  const [customerGstin,  setCustomerGstin]  = useState('');
  const [customerLegal,  setCustomerLegal]  = useState('');

  // ── Derived booking mode flags ────────────────────────────────────────────
  const isTrain  = mode === 'train';
  const isFlight = mode === 'flight';
  const classCode = listing?.classCode || (isFlight ? listing?.travelClass : null) || null;
  const hasBerths = listing?.hasBerths || !!(classCode && getBerthOptions(classCode));

  // ── Quota eligibility ─────────────────────────────────────────────────────
  const availableQuotas = useMemo(() => {
    if (!isTrain) return ['GENERAL'];
    const quotas = ['GENERAL'];

    // LADIES — only if all passengers are female
    const allFemale = passengers.every(p => p.gender === 'female');
    if (allFemale && passengers.length > 0) quotas.push('LADIES');

    // SENIOR_CITIZEN — if any passenger qualifies
    const hasSenior = passengers.some(p => {
      const age = parseInt(p.age) || 0;
      return (p.gender === 'female' && age >= SENIOR_CITIZEN_MIN_AGE_FEMALE) ||
             ((p.gender === 'male' || p.gender === 'other') && age >= SENIOR_CITIZEN_MIN_AGE_MALE);
    });
    if (hasSenior) quotas.push('SENIOR_CITIZEN');

    // TATKAL — journey date must be exactly 1 day away
    // ⚠️ TODO: also enforce 10:00 IST time gate for production
    const daysAway = daysUntilJourney(route?.date);
    if (daysAway !== null && daysAway <= TATKAL_DAYS_BEFORE_JOURNEY) quotas.push('TATKAL');

    // PWD — any passenger marked as disabled
    const hasDisabled = passengers.some(p => p.isDisabled);
    if (hasDisabled) quotas.push('PWD');

    return quotas;
  }, [passengers, isTrain, route?.date]);

  // Reset quota if it's no longer eligible
  useEffect(() => {
    if (!availableQuotas.includes(quota)) setQuota('GENERAL');
  }, [availableQuotas, quota]);

  // Auto-suggest senior citizen: set Lower berth pref for qualifying passengers
  useEffect(() => {
    if (quota !== 'SENIOR_CITIZEN' || !hasBerths) return;
    setPassengers(prev => prev.map(p => {
      const age = parseInt(p.age) || 0;
      const isEligible =
        (p.gender === 'female' && age >= SENIOR_CITIZEN_MIN_AGE_FEMALE) ||
        ((p.gender === 'male' || p.gender === 'other') && age >= SENIOR_CITIZEN_MIN_AGE_MALE);
      return isEligible ? { ...p, berthPref: 'Lower' } : p;
    }));
  }, [quota, hasBerths]);

  // ── Passenger helpers ─────────────────────────────────────────────────────
  const updatePassenger = (id, field, value) =>
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const addPassenger = () => {
    if (passengers.length >= 20) { addToast('Maximum 20 passengers per booking', 'warning'); return; }
    setPassengers(prev => [...prev, {
      id: Date.now(), name: '', age: '', bloodGroup: '', gender: 'male',
      address: '', phone: '', email: '', idType: 'aadhar', idNumber: '',
      berthPref: '', isDisabled: false,
    }]);
  };

  const addEscortPassenger = () => {
    if (passengers.length >= 20) return;
    setPassengers(prev => [...prev, {
      id: Date.now(), name: '', age: '', bloodGroup: '', gender: 'male',
      address: '', phone: '', email: '', idType: 'aadhar', idNumber: '',
      berthPref: 'Lower', isDisabled: false, isEscort: true,
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
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/flights')}>✈️ Flights</button>
          <button className="btn btn-secondary" onClick={() => navigate('/trains')}>🚂 Trains</button>
          <button className="btn btn-secondary" onClick={() => navigate('/ferries')}>🚢 Ferries</button>
          <button className="btn btn-primary"   onClick={() => navigate('/search')}>Search Trips</button>
        </div>
      </div>
    );
  }

  const isAgent = user?.role === 'agent';

  // ── Fare calculation ──────────────────────────────────────────────────────

  // Mock distance if edge function fails/unreachable
  const getMockDistance = (origin, destination) => {
    // simple deterministic mock based on string length
    const val = (origin.length * destination.length * 10) % 500;
    return val < 20 ? 25 : val; 
  };

  useEffect(() => {
    if (mode === 'vehicle' || !isTransit) {
      // Simulate edge function call
      const origin = route?.from || '';
      const dest = route?.to || '';
      const dist = getMockDistance(origin, dest);
      setDistanceKm(dist);
    }
  }, [route, mode, isTransit]);

  const calculatePassengerPrice = (ageStr) => {
    const age = parseInt(ageStr) || 0;
    if (age > 0 && age <= 5) return 0;
    
    let basePrice = route?.price || 0;
    
    // Dynamic fare for vehicles
    if ((mode === 'vehicle' || !isTransit) && vehicle && fareRates && distanceKm) {
      const rate = fareRates.find(f => f.vehicle_type === vehicle.type);
      if (rate) {
        const calculated = rate.base_fare + (distanceKm * rate.per_km_rate);
        basePrice = Math.max(calculated, rate.min_fare);
      }
    }
    
    if (age >= 6 && age <= 7) return Math.round(basePrice / 2);
    return basePrice;
  };

  let totalTicketPrice = passengers.reduce((sum, p) => sum + calculatePassengerPrice(p.age), 0);

  // Tatkal surcharge
  if (quota === 'TATKAL') {
    totalTicketPrice = Math.round(totalTicketPrice * (1 + TATKAL_SURCHARGE_PERCENT / 100));
  }

  const baseFare        = totalTicketPrice; // pre-GST
  const gstModeCode     = isTransit ? mode : 'bus';
  const gstClassCode    = classCode || listing?.listingType || '';
  const gstResult       = calcGst(baseFare, gstModeCode, gstClassCode);

  const freeLuggageLimit = passengers.length * 15;
  const extraLuggage    = Math.max(0, totalLuggageKg - freeLuggageLimit);
  const luggageCost     = extraLuggage * 10;

  const commissionRate   = (usePlatformStore.getState().settings?.agent_commission_rate || 5) / 100;
  const commissionAmount = isAgent ? Math.round((baseFare + gstResult.gstAmount) * commissionRate) : 0;

  let totalAmount   = baseFare + gstResult.gstAmount + luggageCost + commissionAmount;
  let discountAmount = 0;
  if (promoDiscount > 0) {
    discountAmount = Math.round(totalAmount * promoDiscount / 100);
    totalAmount   -= discountAmount;
  }

  // ── Booking submission ────────────────────────────────────────────────
  const handleBook = async () => {
    setIsBooking(true);
    let result;

    if (isTransit) {
      const mockPnr    = mode === 'train'
        ? String(Math.floor(1000000000 + Math.random() * 9000000000)) : null;
      const mockCoach  = mode === 'train'
        ? `${['S','B','A'][Math.floor(Math.random()*3)]}${Math.floor(1+Math.random()*8)}, Seat ${Math.floor(1+Math.random()*72)}` : null;
      const cabinType  = (mode === 'ferry' && listing?.listingType?.toLowerCase().includes('luxury'))
        ? (listing?.selectedCabin || 'Deluxe Cabin')
        : (mode === 'ferry' ? 'Standard Bunk' : null);

      const transitMeta = {
        from:         listing?.from,
        to:           listing?.to,
        price:        totalAmount,
        accepted_tc:  acceptedTC,
        status:       'confirmed',
        operator:     listing?.operator,
        opCode:       listing?.opCode,
        travelClass:  listing?.classLabel || listing?.travelClass || listing?.listingType,
        classCode:    listing?.classCode || null,
        duration:     listing?.duration,
        depart:       listing?.depart,
        arrive:       listing?.arrive,
        listingType:  listing?.listingType,
        vehicleType:  vehicle.type,
        pnr:          mockPnr,
        coachSeat:    mockCoach,
        cabinType,
        // GST
        baseFare,
        gstAmount:    gstResult.gstAmount,
        gstPercent:   gstResult.gstPercent,
        isGstExempt:  gstResult.isExempt,
        gstNote:      gstResult.note,
        // Quota (train only)
        quota:        isTrain ? quota : null,
        // Invoice
        isBusinessInvoice: showGstInvoice && customerGstin && isValidGstin(customerGstin),
        customerGstin:     showGstInvoice ? customerGstin : null,
        customerLegal:     showGstInvoice ? customerLegal : null,
        yatragoGstin:      YATRAGO_GSTIN,
        gstSplitType:      showGstInvoice ? gstSplitType(customerGstin) : null,
      };

      result = await createBooking(
        listing?.id || 'transit-booking',
        passengers, totalLuggageKg, isAgent,
        currentAgent?.id, customerPaymentMode, promoDiscount, promoCode,
        mode, transitMeta
      );
    } else if (isCab) {
      result = await createBooking(routeId, passengers, totalLuggageKg, isAgent, currentAgent?.id, customerPaymentMode, promoDiscount, promoCode);
    } else {
      result = await createBooking(routeId, passengers, totalLuggageKg, isAgent, currentAgent?.id, customerPaymentMode, promoDiscount, promoCode);
    }
    setIsBooking(false);

    if (result?.error) {
      addToast(result.error, 'error');
    } else if (result) {
      if (isAgent) addAgentBooking(result);
      setConfirmedBooking(result);
      setStep(4);
      addToast('Booking confirmed! 🎉', 'success');
      setTimeout(() => addToast(`📧 Ticket sent to ${passengers[0].email}`, 'success'), 1500);
    } else {
      addToast('Failed to create booking', 'error');
    }
  };

  // ── Step 4: Confirmation ──────────────────────────────────────────────────
  if (step === 4 && confirmedBooking) {
    const tm         = confirmedBooking.transit_meta || null;
    const bType      = confirmedBooking.booking_type || (isTransit ? mode : 'route');
    const modeEmoji  = { flight: '✈️', train: '🚂', ferry: '🚢' }[bType] || '🚌';
    const { balance: walletBalance } = useWalletStore.getState();
    const invoiceNum = tm?.isBusinessInvoice ? generateInvoiceNumber(confirmedBooking.id) : null;
    const today      = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const splitType  = tm?.gstSplitType;
    const halfGst    = tm ? Math.round((tm.gstAmount || 0) / 2) : 0;

    return (
      <div className="animate-scale-in" style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 24px', background: 'rgba(46,204,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={48} color="var(--color-accent-green)" />
        </div>
        <h2 style={{ marginBottom: 8 }}>{modeEmoji} Booking Confirmed! 🎉</h2>
        <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 32 }}>
          {tm ? `Your ${bType} ticket is booked. E-ticket sent to your email.` : 'Your ticket has been booked successfully.'}
        </p>

        {/* PNR banner for trains */}
        {tm?.pnr && (
          <div style={{ background: 'linear-gradient(135deg,rgba(20,184,166,0.15),rgba(14,116,144,0.1))', border: '1px solid rgba(20,184,166,0.35)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-accent-teal-light)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>PNR NUMBER</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.18em', color: '#fff', fontFamily: 'monospace' }}>{tm.pnr}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              Coach &amp; Seat: <strong style={{ color: '#fff' }}>{tm.coachSeat}</strong>
              {tm.quota && tm.quota !== 'GENERAL' && (
                <span style={{ marginLeft: 10, background: 'rgba(27,153,139,0.2)', color: 'var(--color-accent-teal-light)', padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                  Quota: {tm.quota}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tax Invoice panel */}
        {invoiceNum && (
          <div style={{ background: 'rgba(244,162,97,0.08)', border: '1px solid rgba(244,162,97,0.3)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-accent-amber)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> TAX INVOICE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>Invoice No.</span><br /><strong>{invoiceNum}</strong></div>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>Invoice Date</span><br /><strong>{today}</strong></div>
              <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-text-tertiary)' }}>Supplier (YatraGo)</span><br /><strong>GSTIN: {YATRAGO_GSTIN}</strong> <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>(placeholder)</span></div>
              <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-text-tertiary)' }}>Recipient</span><br /><strong>{tm.customerLegal}</strong><br /><span style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>{tm.customerGstin}</span></div>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>Taxable Value</span><br /><strong>₹{tm.baseFare?.toLocaleString('en-IN')}</strong></div>
              <div><span style={{ color: 'var(--color-text-tertiary)' }}>Place of Supply</span><br /><strong>{GST_STATE_CODES[gstinStateCode(tm.customerGstin)] || '—'}</strong></div>
              {tm.isGstExempt ? (
                <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-text-tertiary)' }}>GST</span><br /><strong>₹0 (Exempt)</strong></div>
              ) : splitType === 'CGST_SGST' ? (
                <>
                  <div><span style={{ color: 'var(--color-text-tertiary)' }}>CGST ({tm.gstPercent/2}%)</span><br /><strong>₹{halfGst.toLocaleString('en-IN')}</strong></div>
                  <div><span style={{ color: 'var(--color-text-tertiary)' }}>SGST ({tm.gstPercent/2}%)</span><br /><strong>₹{halfGst.toLocaleString('en-IN')}</strong></div>
                </>
              ) : (
                <div><span style={{ color: 'var(--color-text-tertiary)' }}>IGST ({tm.gstPercent}%)</span><br /><strong>₹{tm.gstAmount?.toLocaleString('en-IN')}</strong></div>
              )}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(244,162,97,0.2)', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Invoice Total</span>
              <span>₹{confirmedBooking.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* Booking summary */}
        <div className="booking-summary">
          <div className="booking-summary-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Booking ID</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{confirmedBooking.id}</div>
              </div>
              <span className="badge badge-success" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Confirmed</span>
            </div>
          </div>
          <div className="booking-summary-body">
            <div className="booking-summary-row">
              <span className="label">Route</span>
              <span className="value">{route.from} → {route.to}</span>
            </div>
            {tm && (
              <>
                <div className="booking-summary-row">
                  <span className="label">Operator</span>
                  <span className="value">{tm.operator}{tm.opCode ? ` (${tm.opCode})` : ''}</span>
                </div>
                <div className="booking-summary-row">
                  <span className="label">{bType === 'ferry' ? 'Type' : 'Class'}</span>
                  <span className="value">{tm.travelClass}</span>
                </div>
                {tm.quota && tm.quota !== 'GENERAL' && (
                  <div className="booking-summary-row">
                    <span className="label">Quota</span>
                    <span className="value" style={{ color: 'var(--color-accent-teal-light)', fontWeight: 700 }}>{QUOTA_INFO[tm.quota]?.icon} {QUOTA_INFO[tm.quota]?.label}</span>
                  </div>
                )}
                {tm.depart && (
                  <div className="booking-summary-row">
                    <span className="label">Departure</span>
                    <span className="value">{tm.depart}{tm.arrive ? ` → ${tm.arrive}` : ''} ({tm.duration})</span>
                  </div>
                )}
                {tm.coachSeat && (
                  <div className="booking-summary-row">
                    <span className="label">Coach / Seat</span>
                    <span className="value" style={{ fontWeight: 700, color: 'var(--color-accent-teal-light)' }}>{tm.coachSeat}</span>
                  </div>
                )}
                {tm.cabinType && (
                  <div className="booking-summary-row">
                    <span className="label">Cabin</span>
                    <span className="value" style={{ fontWeight: 700, color: '#60a5fa' }}>{tm.cabinType}</span>
                  </div>
                )}
              </>
            )}
            <div className="booking-summary-row">
              <span className="label">Passengers</span>
              <span className="value">
                {Array.isArray(confirmedBooking.passengerDetails)
                  ? `${confirmedBooking.passengerDetails.length} Person(s) — ${confirmedBooking.passengerDetails.map(p => p.name).filter(Boolean).join(', ')}`
                  : confirmedBooking.passengerDetails?.name || '1 Passenger'}
              </span>
            </div>

            <div className="form-divider" />

            {/* Fare breakdown on confirmation */}
            <div className="booking-summary-row">
              <span className="label">Base Fare</span>
              <span className="value">₹{tm?.baseFare?.toLocaleString('en-IN') || baseFare.toLocaleString('en-IN')}</span>
            </div>
            {tm?.isGstExempt ? (
              <div className="booking-summary-row">
                <span className="label">GST</span>
                <span className="value" style={{ color: '#10b981', fontSize: '0.8rem' }}>Exempt</span>
              </div>
            ) : tm?.gstAmount > 0 ? (
              <div className="booking-summary-row">
                <span className="label">GST ({tm.gstPercent}%)</span>
                <span className="value">₹{tm.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
            ) : null}
            {isAgent && (
              <div className="booking-summary-row">
                <span className="label">Agent Commission</span>
                <span className="value text-amber">₹{commissionAmount}</span>
              </div>
            )}
            <div className="booking-summary-total">
              <span>Total Paid</span>
              <span className="value">₹{confirmedBooking.totalAmount}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/bookings')}>
            <Ticket size={16} /> View in My Bookings
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(
            bType === 'train' ? '/trains' : bType === 'flight' ? '/flights' : bType === 'ferry' ? '/ferries' : '/search'
          )}>
            Book Another {bType === 'train' ? 'Train' : bType === 'flight' ? 'Flight' : bType === 'ferry' ? 'Ferry' : 'Trip'}
          </button>
        </div>

        <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          ⚠️ This is a demo booking — no real ticket is issued.
        </p>
      </div>
    );
  }

  // ── Steps 1–3 ─────────────────────────────────────────────────────────────
  const berthOptions = hasBerths ? getBerthOptions(classCode) : null;
  const hasAnyDisabled = passengers.some(p => p.isDisabled);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Book Your Trip</h1>
        <p>{route.from} → {route.to} • {route.date}</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['Passenger Details', 'Luggage', 'Summary & Pay'].map((label, i) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step > i + 1 ? 'var(--color-accent-green)' : step === i + 1 ? 'var(--gradient-primary)' : 'var(--color-surface-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: step >= i + 1 ? 'white' : 'var(--color-text-tertiary)',
              fontWeight: 700, fontSize: '0.875rem', transition: 'all 300ms ease',
            }}>
              {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: step === i + 1 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Main form */}
        <div>
          {/* ── STEP 1: Passenger Details ───────────────────────────────── */}
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
                <div style={{ background: 'rgba(244,162,97,0.1)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(244,162,97,0.2)' }}>
                  <Shield size={16} color="var(--color-accent-amber)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-accent-amber)' }}>
                    Booking as Agent — 5% commission will be applied
                  </span>
                </div>
              )}

              {passengers.map((p, idx) => {
                const isEscort       = p.isEscort;
                const pBerthOptions  = berthOptions;
                const isSeniorAge    = p.age && (
                  (p.gender === 'female' && parseInt(p.age) >= SENIOR_CITIZEN_MIN_AGE_FEMALE) ||
                  ((p.gender !== 'female') && parseInt(p.age) >= SENIOR_CITIZEN_MIN_AGE_MALE)
                );

                return (
                  <div key={p.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16, background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isEscort ? <><Accessibility size={15} color="#60a5fa" /> Escort Passenger</> : `Passenger ${idx + 1}`}
                      </h4>
                      {passengers.length > 1 && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-accent-red)' }} onClick={() => removePassenger(p.id)}>
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Senior citizen suggestion badge */}
                    {isSeniorAge && isTrain && (
                      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', marginBottom: 12, fontSize: '0.78rem', color: 'var(--color-accent-amber)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <BadgePercent size={13} />
                        Senior Citizen eligible — select <strong>Senior Citizen quota</strong> below for lower-berth priority.
                      </div>
                    )}

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
                        <select className="form-select" value={p.gender} onChange={e => updatePassenger(p.id, 'gender', e.target.value)}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <select className="form-select" value={p.bloodGroup} onChange={e => updatePassenger(p.id, 'bloodGroup', e.target.value)}>
                          <option value="">Select</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Berth preference — train berth classes only */}
                    {isTrain && pBerthOptions && (
                      <div className="form-group">
                        <label className="form-label">Berth Preference <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(optional — subject to availability)</span></label>
                        <select className="form-select" value={p.berthPref} onChange={e => updatePassenger(p.id, 'berthPref', e.target.value)}>
                          <option value="">No preference</option>
                          {pBerthOptions.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    )}

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
                        <label className="form-label">Email (for ticket)</label>
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
                            style={{ flex: 1, padding: '8px' }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{p.idType === 'aadhar' ? 'Aadhar Number' : 'PAN Number'}</label>
                      <div className="form-input-icon-wrapper">
                        <CreditCard className="form-input-icon" size={20} />
                        <input className="form-input"
                          placeholder={p.idType === 'aadhar' ? 'XXXX XXXX XXXX' : 'ABCDE1234F'}
                          value={p.idNumber}
                          onChange={e => updatePassenger(p.id, 'idNumber', e.target.value)}
                          maxLength={p.idType === 'aadhar' ? 14 : 10} />
                      </div>
                    </div>

                    {/* Disability checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-sm)', marginTop: 4 }}>
                      <input
                        type="checkbox"
                        id={`disabled-${p.id}`}
                        checked={p.isDisabled}
                        onChange={e => updatePassenger(p.id, 'isDisabled', e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-accent-teal)', cursor: 'pointer' }}
                      />
                      <label htmlFor={`disabled-${p.id}`} style={{ fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
                        <Accessibility size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom', color: '#60a5fa' }} />
                        This passenger has a disability requiring travel assistance
                      </label>
                    </div>
                  </div>
                );
              })}

              {/* Add escort button when any passenger is disabled */}
              {hasAnyDisabled && passengers.length < 20 && (
                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 12, fontSize: '0.85rem' }} onClick={addEscortPassenger}>
                  <Accessibility size={14} style={{ display: 'inline', marginRight: 6 }} />
                  + Add Escort Passenger (PWD)
                </button>
              )}

              {/* Quota selector — train mode only */}
              {isTrain && availableQuotas.length > 1 && (
                <div style={{ padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
                  <QuotaSelector quota={quota} setQuota={setQuota} availableQuotas={availableQuotas} />
                </div>
              )}

              <button className="btn btn-primary btn-lg btn-full" onClick={() => {
                for (const p of passengers) {
                  if (!p.name || !p.age || !p.idNumber || !p.address || !p.phone || !p.email) {
                    addToast('All fields (Name, Age, Address, Phone, Email, ID) are mandatory for all passengers.', 'error'); return;
                  }
                  if (!/^[a-zA-Z]+(\s+[a-zA-Z]+){2,}$/.test(p.name.trim())) {
                    addToast(`Please enter the full name (First, Middle, and Last) for ${p.name || 'passenger'}.`, 'error'); return;
                  }
                  if (!/^\d{10}$/.test(p.phone.replace(/\D/g, ''))) {
                    addToast(`Phone for ${p.name || 'passenger'} must be exactly 10 digits.`, 'error'); return;
                  }
                  if (p.idType === 'aadhar' && !/^\d{12}$/.test(p.idNumber.replace(/\D/g, ''))) {
                    addToast(`Aadhar for ${p.name || 'passenger'} must be exactly 12 digits.`, 'error'); return;
                  }
                  if (p.idType === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]$/.test(p.idNumber.toUpperCase())) {
                    addToast(`Invalid PAN format for ${p.name || 'passenger'}. Expected: ABCDE1234F`, 'error'); return;
                  }
                }
                setStep(2);
              }} style={{ marginTop: 8 }}>
                Continue to Luggage →
              </button>
            </div>
          )}

          {/* ── STEP 2: Luggage ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                <Luggage size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Luggage Details
              </h3>

              <div style={{ background: 'rgba(46,204,113,0.1)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 20, border: '1px solid rgba(46,204,113,0.2)' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-accent-green)', marginBottom: 4 }}>
                  ✓ {freeLuggageLimit}kg Free Luggage Included ({passengers.length} × 15kg)
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                  Extra luggage at ₹10/kg. Vehicle capacity: {route.luggageAvailable || 50}kg available.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Luggage Weight (kg)</label>
                <input type="range" min={0} max={Math.min(route.luggageAvailable || 50, passengers.length * 60)}
                  value={totalLuggageKg} onChange={e => setTotalLuggageKg(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent-teal)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="text-muted">0 kg</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: totalLuggageKg > freeLuggageLimit ? 'var(--color-accent-amber)' : 'var(--color-accent-green)' }}>
                    {totalLuggageKg} kg
                  </span>
                  <span className="text-muted">{Math.min(route.luggageAvailable || 50, passengers.length * 60)} kg</span>
                </div>
              </div>

              {extraLuggage > 0 && (
                <div style={{ background: 'rgba(244,162,97,0.1)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(244,162,97,0.2)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-accent-amber)' }}>Extra luggage: {extraLuggage}kg × ₹10</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent-amber)' }}>+₹{luggageCost}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep(3)}>Review Summary →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Summary & Pay ──────────────────────────────────── */}
          {step === 3 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                <CheckCircle size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Review &amp; Pay
              </h3>

              {/* Passenger summary */}
              <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>Passengers</div>
                {passengers.map((p, i) => (
                  <div key={p.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>
                      {i + 1}. {p.name} • Age {p.age} • {p.bloodGroup}
                      {p.isEscort && <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#60a5fa' }}>escort</span>}
                      {p.isDisabled && <span style={{ marginLeft: 6 }}>♿</span>}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{p.idType.toUpperCase()}: {p.idNumber}</span>
                      {p.berthPref && <span>Berth: {p.berthPref}</span>}
                    </div>
                  </div>
                ))}
                {isTrain && quota !== 'GENERAL' && (
                  <div style={{ marginTop: 8, fontSize: '0.78rem', display: 'flex', gap: 6, alignItems: 'center', color: 'var(--color-accent-teal-light)' }}>
                    {QUOTA_INFO[quota]?.icon} Quota: <strong>{QUOTA_INFO[quota]?.label}</strong>
                    {quota === 'TATKAL' && <span style={{ color: 'var(--color-accent-amber)' }}>(+{TATKAL_SURCHARGE_PERCENT}% surcharge)</span>}
                  </div>
                )}
              </div>

              {/* Luggage */}
              <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Luggage</div>
                <div style={{ fontWeight: 600 }}>
                  {totalLuggageKg}kg total • {freeLuggageLimit}kg free
                  {extraLuggage > 0 && ` • ${extraLuggage}kg extra (₹${luggageCost})`}
                </div>
              </div>

              {/* Promo code */}
              <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Have a Promo Code?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="form-input" style={{ flex: 1, textTransform: 'uppercase' }} placeholder="Enter code"
                    value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} disabled={promoCode !== null} />
                  {promoCode ? (
                    <button className="btn btn-secondary" onClick={() => { setPromoCode(null); setPromoDiscount(0); setPromoCodeInput(''); }}>Remove</button>
                  ) : (
                    <button className="btn btn-primary" onClick={async () => {
                      if (!promoCodeInput) return;
                      const { data, error } = await supabase.from('promo_codes').select('*').eq('code', promoCodeInput).eq('is_active', true).single();
                      if (error || !data || data.current_uses >= data.max_uses || (data.expires_at && new Date(data.expires_at) < new Date())) {
                        addToast('Invalid, expired, or fully used promo code', 'error');
                      } else {
                        setPromoDiscount(data.discount_percent); setPromoCode(promoCodeInput);
                        addToast(`${data.discount_percent}% discount applied!`, 'success');
                      }
                    }}>Apply</button>
                  )}
                </div>
              </div>

              <div className="form-divider" />

              {/* GST fare breakup panel */}
              <GstBreakupPanel
                baseFare={baseFare}
                gstResult={gstResult}
                luggageCost={luggageCost}
                commissionAmount={commissionAmount}
                discountAmount={discountAmount}
                totalAmount={totalAmount}
                promoCode={promoCode}
              />

              {/* Business GSTIN invoice toggle */}
              <GstInvoicePanel
                gstin={customerGstin}
                setGstin={setCustomerGstin}
                legalName={customerLegal}
                setLegalName={setCustomerLegal}
                isEnabled={showGstInvoice}
                setIsEnabled={setShowGstInvoice}
                gstResult={gstResult}
              />

              <div className="form-divider" />

              {/* Agent payment mode */}
              {isAgent && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Customer Payment Method</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className={`btn ${customerPaymentMode === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCustomerPaymentMode('cash')} style={{ flex: 1 }}>💵 Cash</button>
                    <button className={`btn ${customerPaymentMode === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCustomerPaymentMode('upi')} style={{ flex: 1 }}>📱 UPI</button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 8 }}>
                    Note: Your platform wallet is debited ₹{totalAmount}. This logs how the customer paid you.
                  </p>
                </div>
              )}

              {/* Wallet payment block */}
              <div style={{ padding: 16, background: 'rgba(27,153,139,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(27,153,139,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Wallet size={24} color="var(--color-accent-teal-light)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Pay via Wallet</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                    {isAuthenticated ? `Balance: ₹${balance.toLocaleString()}` : 'Sign in to use wallet balance'}
                  </div>
                </div>
                {isAuthenticated && (balance >= totalAmount ? (
                  <span className="badge badge-success">Sufficient</span>
                ) : (
                  <span className="badge badge-danger">Low Balance</span>
                ))}
              </div>

              {isAuthenticated && balance < totalAmount && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(231,76,60,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-accent-red)', border: '1px solid rgba(231,76,60,0.2)' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Insufficient balance. Please add ₹{(totalAmount - balance).toLocaleString()} to your wallet.
                  <button className="btn btn-sm btn-accent" style={{ marginLeft: 8 }} onClick={() => navigate('/wallet')}>Add Money</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary btn-lg btn-full"
                  onClick={() => gate(handleBook, {
                    type: 'booking',
                    payload: {
                      listing: route,
                      // ── Full form state serialized for Smart Resume ──────
                      // If the guest logs in from another device or the component
                      // remounts, these values are used to restore the form.
                      passengers,
                      quota,
                      step,
                      mode,
                    },
                  })}
                  disabled={isBooking || (isAuthenticated && balance < totalAmount) || (showGstInvoice && customerGstin && !isValidGstin(customerGstin))}>
                  {isBooking ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>Pay ₹{totalAmount.toLocaleString('en-IN')} &amp; Confirm</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <div>
          <div className="booking-summary" style={{ position: 'sticky', top: 24 }}>
            <div className="booking-summary-header">
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>Trip Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9, fontSize: '0.875rem' }}>
                <span>{route.from}</span><ArrowRight size={14} /><span>{route.to}</span>
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
              {isTrain && classCode && (
                <div className="booking-summary-row">
                  <span className="label">Class</span>
                  <span className="value" style={{ fontFamily: 'monospace', color: 'var(--color-accent-teal-light)', fontWeight: 700 }}>
                    {classCode} — {TRAIN_CLASS_META[classCode]?.label || classCode}
                  </span>
                </div>
              )}
              {isTrain && quota !== 'GENERAL' && (
                <div className="booking-summary-row">
                  <span className="label">Quota</span>
                  <span className="value" style={{ color: 'var(--color-accent-amber)', fontWeight: 600 }}>{QUOTA_INFO[quota]?.icon} {QUOTA_INFO[quota]?.label}</span>
                </div>
              )}

              <div className="form-divider" />

              <div className="booking-summary-row">
                <span className="label">Tickets ({passengers.length})</span>
                <span className="value">₹{baseFare.toLocaleString('en-IN')}</span>
              </div>
              {!gstResult.isExempt && gstResult.gstAmount > 0 && (
                <div className="booking-summary-row">
                  <span className="label">GST ({gstResult.gstPercent}%)</span>
                  <span className="value text-amber">₹{gstResult.gstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {gstResult.isExempt && (
                <div className="booking-summary-row">
                  <span className="label">GST</span>
                  <span className="value" style={{ color: '#10b981', fontSize: '0.78rem' }}>Exempt</span>
                </div>
              )}
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
              {discountAmount > 0 && (
                <div className="booking-summary-row">
                  <span className="label">Promo Discount</span>
                  <span className="value" style={{ color: '#10b981' }}>−₹{discountAmount}</span>
                </div>
              )}
              <div className="booking-summary-total">
                <span>Total</span>
                <span className="value">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
