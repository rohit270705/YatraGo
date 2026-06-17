import { useState } from 'react';
import {
  Car, Plus, Calendar, MapPin, DollarSign, AlertTriangle, CheckCircle,
  Shield, Upload, Clock, Users, Luggage, TrendingUp, Bell
} from 'lucide-react';
import { useVehicleStore, useBookingStore, useToastStore } from '../store';

export default function OwnerDashboardPage() {
  const { vehicles, addVehicle } = useVehicleStore();
  const { bookings } = useBookingStore();
  const { addToast } = useToastStore();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '', type: 'SUV', seatingCapacity: 7,
    luggageCapacity: 50, ownerName: '',
  });

  const myVehicles = vehicles.filter(v => v.approved);
  const pendingVehicles = vehicles.filter(v => !v.approved);
  const totalEarnings = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.totalAmount, 0);

  const getDocAlerts = () => {
    const alerts = [];
    vehicles.forEach(v => {
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

  const handleAddVehicle = () => {
    const vehicle = addVehicle({
      ...newVehicle,
      puc: { number: 'PUC-NEW', validUntil: '2027-06-01', status: 'valid' },
      driverLicense: { number: 'DL-NEW', validUntil: '2028-01-01', holder: newVehicle.ownerName },
      insurance: { number: 'INS-NEW', validUntil: '2027-06-01', provider: 'New Provider' },
    });
    addToast('Vehicle registered! Awaiting admin approval.', 'success');
    setShowAddVehicle(false);
    setNewVehicle({ registrationNumber: '', type: 'SUV', seatingCapacity: 7, luggageCapacity: 50, ownerName: '' });
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
          <div className="stat-card-value">{bookings.length * 3}</div>
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
                <button className="btn btn-sm btn-secondary">Renew</button>
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

      {/* My Vehicles */}
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>My Active Vehicles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {myVehicles.map(v => (
          <div key={v.id} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <Car size={24} color="var(--color-accent-teal-light)" />
              <div>
                <div style={{ fontWeight: 700 }}>{v.registrationNumber}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {v.type} • {v.seatingCapacity} seats • {v.luggageCapacity}kg
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-success">PUC ✓</span>
              <span className="badge badge-success">DL ✓</span>
              <span className="badge badge-success">Insurance ✓</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: 8 }}>
              {v.journeyHistory.length} trips completed
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modal-backdrop" onClick={() => setShowAddVehicle(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Luggage Capacity (kg)</label>
                <input type="number" className="form-input" value={newVehicle.luggageCapacity}
                  onChange={e => setNewVehicle(p => ({ ...p, luggageCapacity: parseInt(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input className="form-input" placeholder="Your name"
                  value={newVehicle.ownerName}
                  onChange={e => setNewVehicle(p => ({ ...p, ownerName: e.target.value }))} />
              </div>
            </div>

            <div className="form-divider" />
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
              <Upload size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Documents (RC, PUC, DL, Insurance) will be uploaded after vehicle registration.
              Admin approval is required before the vehicle goes live.
            </p>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddVehicle(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddVehicle}>Register Vehicle</button>
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
    </div>
  );
}
