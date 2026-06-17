import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Weight, Truck, Clock, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useParcelStore, useWalletStore, useToastStore } from '../store';

export default function ParcelPage() {
  const navigate = useNavigate();
  const { parcels, createParcel } = useParcelStore();
  const { balance } = useWalletStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my'
  const [step, setStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const [form, setForm] = useState({
    pickup: '', dropoff: '', senderName: '', senderPhone: '',
    receiverName: '', receiverPhone: '', weightCategory: '',
    weightKg: 5, description: '',
  });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const weightCategories = [
    { id: 'light', label: '< 10kg', range: 'Small parcel', maxKg: 10 },
    { id: 'medium', label: '10-25kg', range: 'Medium box', maxKg: 25 },
    { id: 'heavy', label: '25-50kg', range: 'Large item', maxKg: 50 },
    { id: 'extra', label: '50-100kg', range: 'Bulk goods', maxKg: 100 },
  ];

  const calculatePrice = () => {
    const basePrice = 100;
    const perKg = form.weightKg <= 10 ? 8 : form.weightKg <= 25 ? 12 : form.weightKg <= 50 ? 15 : 20;
    return basePrice + (form.weightKg * perKg);
  };

  const price = calculatePrice();

  const handleBook = async () => {
    if (balance < price) {
      addToast('Insufficient wallet balance', 'error');
      return;
    }
    
    setIsBooking(true);
    
    const result = await createParcel({
      ...form,
      price,
      pickup: form.pickup || 'Mumbai',
      dropoff: form.dropoff || 'Pune',
    });
    
    setIsBooking(false);

    if (result && result.error) {
      addToast(result.error, 'error');
    } else if (result) {
      setTrackingId(result.id);
      addToast('Parcel booking confirmed!', 'success');
      setStep(4);
      setActiveTab('my');
      setForm({ pickup: '', dropoff: '', senderName: '', senderPhone: '', receiverName: '', receiverPhone: '', weightCategory: '', weightKg: 5, description: '' });
    } else {
      addToast('Failed to create parcel booking.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'badge-info';
      case 'picked_up': return 'badge-purple';
      case 'in_transit': return 'badge-warning';
      case 'delivered': return 'badge-success';
      default: return 'badge-info';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Parcel Delivery</h1>
        <p>Send parcels and goods via our vehicle network • Max 100kg</p>
      </div>

      <div className="tabs" style={{ maxWidth: 400 }}>
        <button className={`tab ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
          Book Parcel
        </button>
        <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
          My Parcels ({parcels.length})
        </button>
      </div>

      {activeTab === 'book' ? (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {step === 1 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                <MapPin size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Pickup & Delivery Details
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pickup Location</label>
                  <input className="form-input" placeholder="Enter pickup address"
                    value={form.pickup} onChange={e => updateForm('pickup', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Drop-off Location</label>
                  <input className="form-input" placeholder="Enter delivery address"
                    value={form.dropoff} onChange={e => updateForm('dropoff', e.target.value)} />
                </div>
              </div>

              <div className="form-divider" />

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sender Name</label>
                  <input className="form-input" placeholder="Your name"
                    value={form.senderName} onChange={e => updateForm('senderName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sender Phone</label>
                  <input className="form-input" placeholder="+91 XXXXX XXXXX"
                    value={form.senderPhone} onChange={e => updateForm('senderPhone', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Receiver Name</label>
                  <input className="form-input" placeholder="Receiver's name"
                    value={form.receiverName} onChange={e => updateForm('receiverName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver Phone</label>
                  <input className="form-input" placeholder="+91 XXXXX XXXXX"
                    value={form.receiverPhone} onChange={e => updateForm('receiverPhone', e.target.value)} />
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep(2)}>
                Continue to Weight Selection →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="glass-card animate-slide-up">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>
                <Weight size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Parcel Weight & Description
              </h3>

              <div style={{
                background: 'rgba(244, 162, 97, 0.1)', padding: 12, borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(244, 162, 97, 0.2)', marginBottom: 20, fontSize: '0.875rem',
                color: 'var(--color-accent-amber)',
              }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Maximum parcel weight: <strong>100 kg</strong>
              </div>

              <label className="form-label">Weight Category</label>
              <div className="parcel-weight-selector" style={{ marginBottom: 20 }}>
                {weightCategories.map(cat => (
                  <div key={cat.id}
                    className={`parcel-weight-option ${form.weightCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => { updateForm('weightCategory', cat.id); updateForm('weightKg', Math.min(cat.maxKg, form.weightKg || cat.maxKg / 2)); }}
                  >
                    <div className="parcel-weight-label">{cat.label}</div>
                    <div className="parcel-weight-desc">{cat.range}</div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Exact Weight (kg)</label>
                <input type="range" min={1} max={100} value={form.weightKg}
                  onChange={e => updateForm('weightKg', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent-amber)' }} />
                <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-amber)' }}>
                  {form.weightKg} kg
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea className="form-input" rows={3} placeholder="Describe your parcel contents..."
                  value={form.description} onChange={e => updateForm('description', e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>

              <div style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 20,
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Base price</span>
                  <span>₹100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Weight charges ({form.weightKg}kg)</span>
                  <span>₹{price - 100}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', paddingTop: 12,
                  borderTop: 'var(--border-subtle)', fontWeight: 700, fontSize: '1.125rem',
                }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--color-accent-amber)' }}>₹{price}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-accent btn-lg btn-full" onClick={handleBook} disabled={isBooking}>
                  {isBooking
                    ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    : `Book for ₹${price}`
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* My Parcels List */
        <div>
          {parcels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={36} /></div>
              <h3>No parcels yet</h3>
              <p>Book your first parcel delivery to get started.</p>
              <button className="btn btn-accent" onClick={() => setActiveTab('book')}>Book Parcel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
              {parcels.map(parcel => (
                <div key={parcel.id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Parcel ID</div>
                      <div style={{ fontWeight: 700 }}>{parcel.id}</div>
                    </div>
                    <span className={`badge ${getStatusColor(parcel.status)}`}>
                      {parcel.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
                    <MapPin size={16} color="var(--color-accent-amber)" />
                    {parcel.pickup} <ArrowRight size={14} color="var(--color-text-tertiary)" /> {parcel.dropoff}
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: '0.875rem', color: 'var(--color-text-tertiary)', flexWrap: 'wrap' }}>
                    <span><Weight size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> {parcel.weightKg}kg</span>
                    <span>Sender: {parcel.senderName}</span>
                    <span>Receiver: {parcel.receiverName}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-accent-amber)' }}>₹{parcel.price}</span>
                  </div>

                  {/* Tracking Timeline */}
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                      Tracking Updates
                    </div>
                    {parcel.trackingUpdates.map((update, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem',
                        padding: '4px 0', color: i === parcel.trackingUpdates.length - 1 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                      }}>
                        <CheckCircle size={12} color={i === parcel.trackingUpdates.length - 1 ? 'var(--color-accent-green)' : 'var(--color-text-tertiary)'} />
                        <span style={{ flex: 1 }}>{update.message}</span>
                        <span style={{ fontSize: '0.7rem' }}>{new Date(update.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
