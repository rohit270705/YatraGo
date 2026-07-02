import { useParams, useNavigate } from 'react-router-dom';
import { Car, Shield, Calendar, MapPin, Users, ArrowRight, CheckCircle, AlertTriangle, XCircle, Clock, Navigation } from 'lucide-react';
import { useVehicleStore } from '../store';

export default function VehicleDetailPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { getVehicle } = useVehicleStore();
  const vehicle = getVehicle(vehicleId);

  if (!vehicle) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Car size={36} /></div>
        <h3>Vehicle Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/vehicles')}>Back to Vehicles</button>
      </div>
    );
  }

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
