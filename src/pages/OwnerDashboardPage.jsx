import { useState, useEffect } from 'react';
import {
  Car, Plus, Calendar, MapPin, DollarSign, AlertTriangle, CheckCircle,
  Shield, Upload, Clock, Users, Luggage, TrendingUp, Bell, Trash2, Camera, Image, X
} from 'lucide-react';
import { useVehicleStore, useBookingStore, useToastStore, useAuthStore } from '../store';

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const { vehicles, fetchVehicles, createVehicle, deleteVehicle, isLoading } = useVehicleStore();
  const { bookings, approveBooking, rejectBooking } = useBookingStore();
  const { addToast } = useToastStore();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '', type: 'SUV', seatingCapacity: 7,
    luggageCapacity: 50,
    photos: { front: null, back: null, left: null, right: null, interior: null }
  });
  const [photoPreviews, setPhotoPreviews] = useState({
    front: null, back: null, left: null, right: null, interior: null
  });

  const myVehicles = (vehicles || []).filter(v => v.owner_id === user?.id || v.ownerId === user?.id);
  const pendingVehicles = myVehicles.filter(v => !v.approved);
  const activeVehicles = myVehicles.filter(v => v.approved);

  const myBookings = (bookings || []).filter(b => myVehicles.some(v => v.id === b.route?.vehicle_id || v.id === b.route?.vehicleId || v.id === b.vehicle?.id));
  const pendingBookings = myBookings.filter(b => b.status === 'pending_owner_approval');
  const totalEarnings = myBookings.filter(b => b.status === 'completed' || b.status === 'confirmed').reduce((s, b) => s + (b.totalAmount || b.total_amount || 0), 0);

  const handleApproveBooking = async (bookingId) => {
    const res = await approveBooking(bookingId);
    if (res.success) addToast('Booking approved! Passenger can now pay.', 'success');
    else addToast(res.error, 'error');
  };

  const handleRejectBooking = async (bookingId) => {
    const res = await rejectBooking(bookingId);
    if (res.success) addToast('Booking rejected.', 'success');
    else addToast(res.error, 'error');
  };

  const getDocAlerts = () => {
    const alerts = [];
    myVehicles.forEach(v => {
      [
        { name: 'PUC', doc: v.puc },
        { name: 'DL', doc: v.driverLicense },
        { name: 'Insurance', doc: v.insurance }
      ].forEach(({ name, doc }) => {
        if (doc?.validUntil) {
          const daysLeft = Math.ceil((new Date(doc.validUntil) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 30 && daysLeft > 0) {
            alerts.push({ vehicle: v.registrationNumber, doc: name, daysLeft, type: 'warning' });
          } else if (daysLeft <= 0) {
            alerts.push({ vehicle: v.registrationNumber, doc: name, daysLeft, type: 'expired' });
          }
        }
      });
    });
    return alerts;
  };

  const docAlerts = getDocAlerts();

  const handleRenew = (vehicleReg, docName) => {
    addToast(`Renewal request for ${vehicleReg} ${docName} submitted successfully.`, 'success');
  };

  const handlePhotoSelect = (photoType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('Photo must be less than 5MB', 'error');
      return;
    }
    setNewVehicle(p => ({ ...p, photos: { ...p.photos, [photoType]: file } }));
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreviews(p => ({ ...p, [photoType]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removePhotoPreview = (photoType) => {
    setNewVehicle(p => ({ ...p, photos: { ...p.photos, [photoType]: null } }));
    setPhotoPreviews(p => ({ ...p, [photoType]: null }));
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.registrationNumber) {
      addToast('Registration number is required', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const { success, error } = await createVehicle({
      ...newVehicle,
      owner_id: user.id
    });
    
    setIsSubmitting(false);

    if (success) {
      addToast('Vehicle registered with photos! Awaiting admin approval.', 'success');
      setShowAddVehicle(false);
      setNewVehicle({
        registrationNumber: '', type: 'SUV', seatingCapacity: 7,
        luggageCapacity: 50,
        photos: { front: null, back: null, left: null, right: null, interior: null }
      });
      setPhotoPreviews({ front: null, back: null, left: null, right: null, interior: null });
    } else {
      addToast(error || 'Failed to add vehicle', 'error');
    }
  };

  const handleDeleteVehicle = async (vehicleId, regNumber) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${regNumber}? This action cannot be undone.`)) return;
    const result = await deleteVehicle(vehicleId);
    if (result.success) {
      addToast(`Vehicle ${regNumber} removed successfully.`, 'success');
    } else {
      addToast(result.error || 'Failed to delete vehicle', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Vehicle Owner Dashboard</h1>
        <p>Manage your vehicles, routes, and earnings</p>
      </div>

      {/* Stats */}
      <div className="stats-grid stagger-children">
        <div className="stat-card">
          <div className="stat-card-icon teal"><Car size={22} /></div>
          <div className="stat-card-label">My Vehicles</div>
          <div className="stat-card-value">{myVehicles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><TrendingUp size={22} /></div>
          <div className="stat-card-label">Total Earnings</div>
          <div className="stat-card-value">₹{totalEarnings.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><Users size={22} /></div>
          <div className="stat-card-label">Total Passengers</div>
          <div className="stat-card-value">{myBookings.length * 3}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><Bell size={22} /></div>
          <div className="stat-card-label">Doc Alerts</div>
          <div className="stat-card-value">{docAlerts.length}</div>
        </div>
      </div>

      {/* Document Expiry Alerts */}
      {docAlerts.length > 0 && (
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="var(--color-accent-amber)" /> Document Expiry Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docAlerts.map((alert, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: alert.type === 'expired' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(244, 162, 97, 0.1)',
                border: `1px solid ${alert.type === 'expired' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(244, 162, 97, 0.2)'}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <AlertTriangle size={16} color={alert.type === 'expired' ? 'var(--color-accent-red)' : 'var(--color-accent-amber)'} />
                <span style={{ fontSize: '0.875rem', flex: 1 }}>
                  <strong>{alert.vehicle}</strong> — {alert.doc}
                  {alert.type === 'expired'
                    ? <span style={{ color: 'var(--color-accent-red)' }}> has expired!</span>
                    : <span style={{ color: 'var(--color-accent-amber)' }}> expires in {alert.daysLeft} days</span>
                  }
                </span>
                <button className="btn btn-sm btn-secondary" onClick={() => handleRenew(alert.vehicle, alert.doc)}>Renew</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, margin: '24px 0' }}>
        <button className="btn btn-primary" onClick={() => setShowAddVehicle(true)}>
          <Plus size={16} /> Register New Vehicle
        </button>
        <button className="btn btn-secondary" onClick={() => setShowRouteModal(true)}>
          <MapPin size={16} /> Set Routes & Availability
        </button>
      </div>

      {/* Pending Approvals */}
      {pendingVehicles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Pending Admin Approval</h3>
          {pendingVehicles.map(v => (
            <div key={v.id} className="glass-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Car size={24} color="var(--color-accent-amber)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{v.registrationNumber}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                    {v.type} • {v.seatingCapacity} seats
                  </div>
                </div>
                <span className="badge badge-warning"><Clock size={12} /> Awaiting Approval</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Requests */}
      {pendingBookings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Booking Requests</h3>
          {pendingBookings.map(b => (
            <div key={b.id} className="glass-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600 }}>{b.route?.from_city || b.route?.from} → {b.route?.to_city || b.route?.to}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                    {b.route?.journey_date || b.route?.date} at {b.route?.departure_time || b.route?.departureTime} • {b.passengerDetails?.length || b.passenger_details?.length || 1} Passengers
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-accent-teal)', marginTop: 4 }}>
                    Total: ₹{b.totalAmount || b.total_amount}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleRejectBooking(b.id)}>Reject</button>
                  <button className="btn btn-sm btn-primary" onClick={() => handleApproveBooking(b.id)}><CheckCircle size={14} /> Accept</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Vehicles */}
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>My Active Vehicles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {myVehicles.filter(v => v.approved).map(v => (
          <div key={v.id} className="glass-card">
            {/* Vehicle Photos Carousel */}
            {v.photos && Object.values(v.photos).some(p => p) && (
              <div style={{
                display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto',
                paddingBottom: 6, scrollbarWidth: 'thin'
              }}>
                {Object.entries(v.photos).filter(([, url]) => url).map(([key, url]) => (
                  <div key={key} onClick={() => setShowPhotoViewer({ vehicle: v, photoKey: key })}
                    style={{
                      minWidth: 80, height: 60, borderRadius: 'var(--radius-sm)',
                      backgroundImage: `url(${url})`, backgroundSize: 'cover',
                      backgroundPosition: 'center', cursor: 'pointer',
                      border: '2px solid var(--color-border-subtle)',
                      position: 'relative', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent-teal)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
                  >
                    <span style={{
                      position: 'absolute', bottom: 2, left: 0, right: 0,
                      fontSize: '0.6rem', textAlign: 'center', color: '#fff',
                      background: 'rgba(0,0,0,0.6)', padding: '1px 0',
                      textTransform: 'capitalize', borderRadius: '0 0 4px 4px'
                    }}>{key}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <Car size={24} color="var(--color-accent-teal-light)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{v.registrationNumber}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {v.type} • {v.seatingCapacity} seats • {v.luggageCapacity}kg
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => handleDeleteVehicle(v.id, v.registrationNumber)}
                style={{ background: 'rgba(231, 76, 60, 0.15)', color: 'var(--color-accent-red)', border: 'none', padding: '6px 10px' }}
                title="Delete Vehicle">
                <Trash2 size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-success">PUC ✓</span>
              <span className="badge badge-success">DL ✓</span>
              <span className="badge badge-success">Insurance ✓</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: 8 }}>
              {(v.journeyHistory || []).length} trips completed
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modal-backdrop" onClick={() => setShowAddVehicle(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Vehicle</h3>
              <button className="modal-close" onClick={() => setShowAddVehicle(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Registration Number</label>
              <input className="form-input" placeholder="MH-XX-AB-1234"
                value={newVehicle.registrationNumber}
                onChange={e => setNewVehicle(p => ({ ...p, registrationNumber: e.target.value.toUpperCase() }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" value={newVehicle.type}
                  onChange={e => setNewVehicle(p => ({ ...p, type: e.target.value }))}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Mini Bus">Mini Bus</option>
                  <option value="Tempo Traveller">Tempo Traveller</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input type="number" className="form-input" value={newVehicle.seatingCapacity}
                  onChange={e => setNewVehicle(p => ({ ...p, seatingCapacity: parseInt(e.target.value) }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Luggage Capacity (kg)</label>
              <input type="number" className="form-input" value={newVehicle.luggageCapacity}
                onChange={e => setNewVehicle(p => ({ ...p, luggageCapacity: parseInt(e.target.value) }))} />
            </div>

            <div className="form-divider" />

            {/* Photo Upload Section */}
            <h4 style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={18} color="var(--color-accent-teal)" /> Vehicle Photos
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
              Upload clear photos of your vehicle. Customers will see these when booking. Max 5MB per photo.
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12, marginBottom: 20
            }}>
              {[
                { key: 'front', label: 'Front View', icon: '🚗' },
                { key: 'back', label: 'Back View', icon: '🔙' },
                { key: 'left', label: 'Left Side', icon: '⬅️' },
                { key: 'right', label: 'Right Side', icon: '➡️' },
                { key: 'interior', label: 'Interior', icon: '💺' },
              ].map(({ key, label, icon }) => (
                <div key={key} style={{
                  position: 'relative', borderRadius: 'var(--radius-md)',
                  border: photoPreviews[key]
                    ? '2px solid var(--color-accent-teal)'
                    : '2px dashed var(--color-border-subtle)',
                  background: photoPreviews[key]
                    ? 'transparent'
                    : 'var(--color-surface)',
                  overflow: 'hidden', aspectRatio: '4/3',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {photoPreviews[key] ? (
                    <>
                      <img src={photoPreviews[key]} alt={label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={(e) => { e.stopPropagation(); removePhotoPreview(key); }}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(231, 76, 60, 0.9)', border: 'none',
                          color: '#fff', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', padding: 0
                        }}>
                        <X size={12} />
                      </button>
                      <span style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        fontSize: '0.7rem', textAlign: 'center', color: '#fff',
                        background: 'rgba(0,0,0,0.6)', padding: '3px 0',
                      }}>{label} ✓</span>
                    </>
                  ) : (
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 4, cursor: 'pointer',
                      width: '100%', height: '100%', padding: 8
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>{label}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handlePhotoSelect(key, e.target.files[0])} />
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div className="form-divider" />
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
              <Upload size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Documents (RC, PUC, DL, Insurance) will be uploaded after vehicle registration.
              Admin approval is required before the vehicle goes live.
            </p>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddVehicle(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddVehicle} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Uploading...</>
                ) : (
                  <><Plus size={16} /> Register Vehicle</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="modal-backdrop" onClick={() => setShowRouteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Set Route & Availability</h3>
              <button className="modal-close" onClick={() => setShowRouteModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Select Vehicle</label>
              <select className="form-select">
                {myVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Starting Point</label>
                <input className="form-input" placeholder="e.g., Mumbai" />
              </div>
              <div className="form-group">
                <label className="form-label">Destination</label>
                <input className="form-input" placeholder="e.g., Pune" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Intermediate Stops (comma-separated)</label>
              <input className="form-input" placeholder="e.g., Lonavala, Khandala" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Available Date</label>
                <input type="date" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Departure Time</label>
                <input type="time" className="form-input" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Available Seats</label>
                <input type="number" className="form-input" placeholder="e.g., 7" />
              </div>
              <div className="form-group">
                <label className="form-label">Luggage Capacity (kg)</label>
                <input type="number" className="form-input" placeholder="e.g., 50" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRouteModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                addToast('Route saved successfully!', 'success');
                setShowRouteModal(false);
              }}>Save Route</button>
            </div>
          </div>
        </div>
      )}
      {/* Photo Viewer Modal */}
      {showPhotoViewer && (
        <div className="modal-backdrop" onClick={() => setShowPhotoViewer(null)}
          style={{ zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth: 800, width: '90vw', background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderBottom: 'var(--border-subtle)',
            }}>
              <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Image size={20} color="var(--color-accent-teal)" />
                {showPhotoViewer.vehicle.registrationNumber} — Photos
              </h3>
              <button className="modal-close" onClick={() => setShowPhotoViewer(null)}>✕</button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12, padding: 20
            }}>
              {Object.entries(showPhotoViewer.vehicle.photos || {}).filter(([, url]) => url).map(([key, url]) => (
                <div key={key} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
                  <img src={url} alt={key}
                    style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }} />
                  <span style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.65)', color: '#fff',
                    textAlign: 'center', padding: '6px', fontSize: '0.8rem',
                    textTransform: 'capitalize', fontWeight: 600
                  }}>{key} View</span>
                </div>
              ))}
              {Object.values(showPhotoViewer.vehicle.photos || {}).every(p => !p) && (
                <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 40 }}>
                  No photos uploaded for this vehicle.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
