import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle, XCircle, AlertTriangle, MapPin, Shield, Eye, Calendar, Users } from 'lucide-react';
import { useVehicleStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';

export default function VehiclesPage() {
  const navigate = useNavigate();
  const { vehicles, isLoading } = useVehicleStore();

  const getStatusBadge = (vehicle) => {
    if (!vehicle.approved) return <span className="badge badge-warning"><AlertTriangle size={12} /> Pending Approval</span>;
    if (vehicle.isActive) return <span className="badge badge-success"><CheckCircle size={12} /> Active</span>;
    return <span className="badge badge-danger"><XCircle size={12} /> Inactive</span>;
  };

  const getDocStatus = (doc) => {
    if (!doc?.validUntil) return 'unknown';
    const expiry = new Date(doc.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft < 30) return 'expiring';
    return 'valid';
  };

  const getDocBadge = (status) => {
    switch (status) {
      case 'valid': return <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Valid</span>;
      case 'expiring': return <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Expiring Soon</span>;
      case 'expired': return <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>Expired</span>;
      default: return <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>Unknown</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Vehicles</h1>
        <p>View all registered vehicles and their document status</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-card-icon teal"><Car size={22} /></div>
          <div className="stat-card-label">Total Vehicles</div>
          <div className="stat-card-value">{vehicles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><CheckCircle size={22} /></div>
          <div className="stat-card-label">Active</div>
          <div className="stat-card-value">{vehicles.filter(v => v.approved && v.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><AlertTriangle size={22} /></div>
          <div className="stat-card-label">Pending Approval</div>
          <div className="stat-card-value">{vehicles.filter(v => !v.approved).length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger-children">
        {isLoading ? (
          <SkeletonLoader type="list" count={3} />
        ) : vehicles.map(vehicle => (
          <div key={vehicle.id} className="glass-card clickable" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* Vehicle Icon */}
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius-md)',
                background: 'rgba(27, 153, 139, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                overflow: 'hidden'
              }}>
                {(vehicle.imageUrl || vehicle.image_url) ? <img src={vehicle.imageUrl || vehicle.image_url} alt={vehicle.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Car size={28} color="var(--color-accent-teal-light)" />}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{vehicle.registrationNumber}</h3>
                  {getStatusBadge(vehicle)}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                  {vehicle.type} • {vehicle.seatingCapacity} seats • {vehicle.luggageCapacity}kg luggage
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Owner: <strong>{vehicle.ownerName}</strong>
                </p>

                {/* Document Status Row */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                    background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}>
                    <Shield size={12} /> PUC {getDocBadge(getDocStatus(vehicle.puc))}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                    background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}>
                    <Shield size={12} /> DL {getDocBadge(getDocStatus(vehicle.driverLicense))}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                    background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}>
                    <Shield size={12} /> Insurance {getDocBadge(getDocStatus(vehicle.insurance))}
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  {vehicle.journeyHistory?.length || 0} trips completed
                </div>
                <button className="btn btn-secondary btn-sm">
                  <Eye size={14} /> View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
