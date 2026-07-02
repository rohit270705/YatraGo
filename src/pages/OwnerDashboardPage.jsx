import { useState, useEffect } from 'react';
import {
  Car, Plus, Calendar, MapPin, DollarSign, AlertTriangle, CheckCircle,
  Shield, Upload, Clock, Users, Luggage, TrendingUp, Bell, Trash2, Camera, Image, X, FileText, UploadCloud
} from 'lucide-react';
import { useVehicleStore, useBookingStore, useToastStore, useAuthStore, useWalletStore, useDriverStore } from '../store';

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const { vehicles, fetchVehicles, createVehicle, deleteVehicle, isLoading } = useVehicleStore();
  const { bookings, approveBooking, rejectBooking } = useBookingStore();
  const { balance, withdrawals, requestWithdrawal } = useWalletStore();
  const { links: driverLinks, fetchLinks, sendLinkRequest, updateLinkStatus, availableDrivers, fetchAvailableDrivers } = useDriverStore();
  const { addToast } = useToastStore();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(null);
  
  // Document Upload State
  const [showDocUpload, setShowDocUpload] = useState(null);
  const [docForm, setDocForm] = useState({
    rcNumber: '', rcValidUntil: '', rcPhoto: null,
    pucNumber: '', pucValidUntil: '', pucPhoto: null,
    dlNumber: '', dlHolderName: '', dlValidUntil: '', dlPhoto: null
  });
  const [docPreviews, setDocPreviews] = useState({ rc: null, puc: null, dl: null });

  // Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankAccount: '', ifscCode: '' });

  useEffect(() => {
    fetchVehicles();
    if (user?.id) fetchLinks(user.id, 'owner');
    fetchAvailableDrivers(true); // true = vehicleLessOnly
  }, [fetchVehicles, fetchLinks, user?.id]);

  const [driverLicenseInput, setDriverLicenseInput] = useState('');

  const handleLinkDriver = async () => {
    if (!driverLicenseInput) return;
    setIsSubmitting(true);
    const res = await sendLinkRequest(user.id, driverLicenseInput);
    if (res.success) {
      addToast('Request sent successfully!', 'success');
      setDriverLicenseInput('');
    } else {
      addToast(res.error, 'error');
    }
    setIsSubmitting(false);
  };

  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '', modelName: '', variant: '', fuelType: 'Petrol', type: 'Hatchback', seatingCapacity: 5,
    purchaseDate: '',
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

  const handleRegistrationChange = (e) => {
    let val = e.target.value.toUpperCase();
    let clean = val.replace(/[^A-Z0-9]/g, '');
    let formatted = '';
    
    for (let i = 0; i < clean.length && i < 10; i++) {
      let char = clean[i];
      if (i < 2) {
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      } else if (i < 4) {
        if (i === 2) formatted += '-';
        if (/[0-9]/.test(char)) formatted += char;
        else break;
      } else if (i < 6) {
        if (i === 4) formatted += '-';
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      } else {
        if (i === 6) formatted += '-';
        if (/[0-9]/.test(char)) formatted += char;
        else break;
      }
    }
    
    setNewVehicle(p => ({ ...p, registrationNumber: formatted }));
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
        registrationNumber: '', modelName: '', variant: '', fuelType: 'Petrol', type: 'Hatchback', seatingCapacity: 5,
        purchaseDate: '',
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

  const handleDocFileSelect = (docType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('File must be less than 5MB', 'error');
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      addToast('Only JPG and PNG files are allowed', 'error');
      return;
    }
    setDocForm(p => ({ ...p, [`${docType}Photo`]: file }));
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocPreviews(p => ({ ...p, [docType]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.rcPhoto || !docForm.pucPhoto || !docForm.dlPhoto) {
      addToast('Please upload all required document photos', 'error');
      return;
    }

    setIsSubmitting(true);
    const { submitVehicleDocuments } = useVehicleStore.getState();
    const result = await submitVehicleDocuments(showDocUpload.id, docForm);
    setIsSubmitting(false);

    if (result.success) {
      addToast('Documents submitted successfully!', 'success');
      setShowDocUpload(null);
      setDocForm({
        rcNumber: '', rcPhoto: null,
        pucNumber: '', pucValidUntil: '', pucPhoto: null,
        dlNumber: '', dlHolderName: '', dlValidUntil: '', dlPhoto: null
      });
      setDocPreviews({ rc: null, puc: null, dl: null });
    } else {
      addToast(result.error || 'Failed to submit documents', 'error');
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawForm.amount);
    if (!amount || amount <= 0) return addToast('Enter a valid amount', 'error');
    if (amount > balance) return addToast('Insufficient wallet balance', 'error');
    if (!withdrawForm.bankAccount || !withdrawForm.ifscCode) return addToast('Enter bank details', 'error');

    setIsSubmitting(true);
    const result = await requestWithdrawal(amount, withdrawForm.bankAccount, withdrawForm.ifscCode);
    setIsSubmitting(false);

    if (result.success) {
      addToast('Withdrawal requested successfully! Admin will process it soon.', 'success');
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', bankAccount: '', ifscCode: '' });
    } else {
      addToast(result.error || 'Failed to request withdrawal', 'error');
    }
  };

  const vehiclesNeedingDocs = activeVehicles.filter(v => !v.documentsSubmitted && v.approved);

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

      {/* Wallet & Withdrawals */}
      <div style={{ marginTop: 24, marginBottom: 24, background: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--color-border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 700, margin: 0 }}>Wallet & Withdrawals</h3>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>Available Balance: <strong style={{ color: 'var(--color-accent-green)', fontSize: '1.1rem' }}>₹{balance.toLocaleString()}</strong></div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowWithdrawModal(true)} disabled={balance <= 0}>
            <DollarSign size={18} /> Request Withdrawal
          </button>
        </div>

        {withdrawals?.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Bank Account</th>
                  <th>IFSC</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.slice(0, 5).map(w => (
                  <tr key={w.id}>
                    <td>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{w.amount.toLocaleString()}</td>
                    <td>{w.bank_account}</td>
                    <td>{w.ifsc_code}</td>
                    <td>
                      <span className={`badge badge-${w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'error' : 'warning'}`}>
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, margin: '24px 0' }}>
        <button className="btn btn-primary" onClick={() => setShowAddVehicle(true)}>
          <Plus size={16} /> Register New Vehicle
        </button>
        <button className="btn btn-secondary" onClick={() => setShowRouteModal(true)}>
          <MapPin size={16} /> Set Routes & Availability
        </button>
      </div>

      {/* Vehicles Needing Documents (Approved but docs pending) */}
      {vehiclesNeedingDocs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent-red)' }}>
              <AlertTriangle size={20} /> Action Required: Upload Documents
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              The following vehicles have been approved by the admin. Please upload their RC Book, PUC Certificate, and your Driving License to complete registration and make them visible to passengers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {vehiclesNeedingDocs.map(v => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--color-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Car size={20} color="var(--color-accent-teal)" />
                    <span style={{ fontWeight: 600 }}>{v.registrationNumber} ({v.type})</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowDocUpload(v)}>
                    <UploadCloud size={14} /> Upload Documents
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* My Drivers */}
      <div style={{ marginTop: 24, marginBottom: 24, background: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--color-border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>My Drivers</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" className="form-input" placeholder="Driver License No." value={driverLicenseInput} onChange={(e) => setDriverLicenseInput(e.target.value.toUpperCase())} style={{ padding: '6px 12px', minWidth: 200 }} />
            <button className="btn btn-primary" onClick={handleLinkDriver} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Link Driver'}
            </button>
          </div>
        </div>
        
        {driverLinks && driverLinks.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>License Number</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {driverLinks.map(link => (
                  <tr key={link.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {link.driver_profiles?.license_photo_url ? (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundImage: `url(${link.driver_profiles.license_photo_url})`, backgroundSize: 'cover' }} />
                        ) : (
                          <Users size={20} color="var(--color-text-tertiary)" />
                        )}
                        <span style={{ fontWeight: 600 }}>{link.driver_profiles?.name || link.users?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{link.driver_profiles?.license_number}</td>
                    <td>{link.users?.phone || link.users?.email}</td>
                    <td>
                      <span className={`badge badge-${link.status === 'active' ? 'success' : link.status === 'rejected' ? 'error' : 'warning'}`}>
                        {link.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => updateLinkStatus(link.id, 'rejected', user.id, 'owner')}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            No drivers linked yet. Enter a driver's license number to send an employment request.
          </div>
        )}
      </div>
      
      {/* Vehicle-less Drivers Pool */}
      <div style={{ marginBottom: 24, background: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--color-border-subtle)' }}>
        <h3 style={{ fontWeight: 700, margin: 0, marginBottom: 16 }}>Available Skill-Only Drivers</h3>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginBottom: 16 }}>
          These drivers don't have their own vehicle. You can link them to drive your cars.
        </p>
        
        {availableDrivers && availableDrivers.length > 0 ? (
          <div className="grid">
            {availableDrivers.map(driver => (
              <div key={driver.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {driver.license_photo_url ? (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundImage: `url(${driver.license_photo_url})`, backgroundSize: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="var(--color-text-tertiary)" />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0 }}>{driver.name || 'Driver'}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      License: {driver.license_number} <br/>
                      {driver.license_category && <span>Cat: {driver.license_category}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setDriverLicenseInput(driver.license_number);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Hire
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            No vehicle-less drivers available right now.
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modal-backdrop" onClick={() => setShowAddVehicle(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Vehicle</h3>
              <button className="modal-close" onClick={() => setShowAddVehicle(false)}>✕</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Registration Number</label>
                <input className="form-input" placeholder="MH-02-AB-9999"
                  value={newVehicle.registrationNumber}
                  onChange={handleRegistrationChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input type="date" className="form-input"
                  value={newVehicle.purchaseDate}
                  onChange={e => setNewVehicle(p => ({ ...p, purchaseDate: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Model Name</label>
                <input className="form-input" placeholder="e.g. Swift, Innova Crysta"
                  value={newVehicle.modelName}
                  onChange={e => setNewVehicle(p => ({ ...p, modelName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Variant</label>
                <input className="form-input" placeholder="e.g. VXI, ZXI+"
                  value={newVehicle.variant}
                  onChange={e => setNewVehicle(p => ({ ...p, variant: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <select className="form-select" value={newVehicle.fuelType}
                  onChange={e => setNewVehicle(p => ({ ...p, fuelType: e.target.value }))}>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" value={newVehicle.type}
                  onChange={e => setNewVehicle(p => ({ ...p, type: e.target.value }))}>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedan/Saloon/Notchback">Sedan/Saloon/Notchback</option>
                  <option value="Compact Sedan">Compact Sedan</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Micro Car">Micro Car</option>
                  <option value="CUV/Crossover">CUV/Crossover</option>
                  <option value="Crossover Hatchback">Crossover Hatchback</option>
                  <option value="MPV/Minivan">MPV/Minivan</option>
                  <option value="SUV (Sports Utility Vehicle)">SUV (Sports Utility Vehicle)</option>
                  <option value="Crossover SUV">Crossover SUV</option>
                  <option value="Coupe SUV">Coupe SUV</option>
                  <option value="Compact SUV">Compact SUV</option>
                  <option value="4-Door Coupe">4-Door Coupe</option>
                  <option value="Station Wagon">Station Wagon</option>
                  <option value="Convertible/Spyder/Cabriolet">Convertible/Spyder/Cabriolet</option>
                  <option value="Hybrid Cars">Hybrid Cars</option>
                  <option value="Pick-Up Truck/Temp">Pick-Up Truck/Temp</option>
                  <option value="Electric Cars">Electric Cars</option>
                  <option value="VAN">VAN</option>
                  <option value="BUS">BUS</option>
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
              <select className="form-select" defaultValue="">
                {myVehicles.length === 0 ? (
                  <option value="" disabled>No vehicles registered (Please add one first)</option>
                ) : (
                  <>
                    <option value="" disabled>Select a vehicle...</option>
                    {myVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>)}
                  </>
                )}
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

            <div className="form-group">
              <label className="form-label">Assign Driver (Optional)</label>
              <select className="form-select" defaultValue="">
                <option value="">No driver assigned (Self-driven / Unassigned)</option>
                {driverLinks?.filter(l => l.status === 'active').map(link => (
                  <option key={link.driver_profiles.id} value={link.driver_profiles.id}>
                    {link.driver_profiles.name} ({link.driver_profiles.license_number})
                  </option>
                ))}
              </select>
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
      {/* Document Upload Modal */}
      {showDocUpload && (
        <div className="modal-backdrop" onClick={() => setShowDocUpload(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--color-accent-teal)" />
                Upload Documents: {showDocUpload.registrationNumber}
              </h3>
              <button className="modal-close" onClick={() => setShowDocUpload(null)}>✕</button>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)', marginBottom: 20 }}>
              Please upload clear, legible photos of the following documents. Max 5MB per photo (JPG/PNG).
            </p>

            <form onSubmit={handleDocumentSubmit}>
              {/* RC Book */}
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>1. RC Book</h4>
                <div className="form-group">
                  <label className="form-label">RC Number</label>
                  <input className="form-input" required value={docForm.rcNumber} onChange={e => setDocForm(p => ({ ...p, rcNumber: e.target.value.toUpperCase() }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">RC Photo</label>
                  <input type="file" className="form-input" accept=".jpg,.jpeg,.png" required onChange={e => handleDocFileSelect('rc', e.target.files[0])} />
                </div>
              </div>

              {/* PUC Certificate */}
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>2. PUC Certificate</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">PUC Number</label>
                    <input className="form-input" required value={docForm.pucNumber} onChange={e => setDocForm(p => ({ ...p, pucNumber: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Until</label>
                    <input type="date" className="form-input" required value={docForm.pucValidUntil} onChange={e => setDocForm(p => ({ ...p, pucValidUntil: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">PUC Photo</label>
                  <input type="file" className="form-input" accept=".jpg,.jpeg,.png" required onChange={e => handleDocFileSelect('puc', e.target.files[0])} />
                </div>
              </div>

              {/* Driving License */}
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>3. Driving License</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">DL Number</label>
                    <input className="form-input" required value={docForm.dlNumber} onChange={e => setDocForm(p => ({ ...p, dlNumber: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Holder Name</label>
                    <input className="form-input" required value={docForm.dlHolderName} onChange={e => setDocForm(p => ({ ...p, dlHolderName: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Valid Until</label>
                  <input type="date" className="form-input" required value={docForm.dlValidUntil} onChange={e => setDocForm(p => ({ ...p, dlValidUntil: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">DL Photo</label>
                  <input type="file" className="form-input" accept=".jpg,.jpeg,.png" required onChange={e => handleDocFileSelect('dl', e.target.files[0])} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDocUpload(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Uploading...</>
                  ) : (
                    <><UploadCloud size={16} /> Submit Documents</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setShowWithdrawModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Request Withdrawal</h3>
              <button className="modal-close" onClick={() => !isSubmitting && setShowWithdrawModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRequestWithdrawal}>
              <div className="form-group">
                <label className="form-label">Available Balance</label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-green)' }}>
                  ₹{balance.toLocaleString()}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Amount to Withdraw (₹)</label>
                <input type="number" className="form-input" required min="1" max={balance}
                  value={withdrawForm.amount}
                  onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input type="text" className="form-input" required
                  value={withdrawForm.bankAccount}
                  onChange={e => setWithdrawForm({...withdrawForm, bankAccount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input type="text" className="form-input" required style={{ textTransform: 'uppercase' }}
                  value={withdrawForm.ifscCode}
                  onChange={e => setWithdrawForm({...withdrawForm, ifscCode: e.target.value.toUpperCase()})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
