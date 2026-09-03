import { MapPin, Clock, Car, Home, UtensilsCrossed, Package, Activity, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NODE_TYPE_CONFIG = {
  vehicle:   { icon: '🚗', iconComp: Car,            label: 'Vehicle',   route: (id) => `/vehicle/${id}` },
  stay:      { icon: '🏠', iconComp: Home,           label: 'Stay',      route: () => '/host' },
  food:      { icon: '🍛', iconComp: UtensilsCrossed, label: 'Food',      route: () => '/search?type=food' },
  parcel:    { icon: '📦', iconComp: Package,        label: 'Parcel',    route: () => '/parcel' },
  activity:  { icon: '🎯', iconComp: Activity,       label: 'Activity',  route: () => '/search?type=activity' },
  transport: { icon: '🚌', iconComp: Bus,            label: 'Transport', route: () => '/search' },
};

const STATUS_LABELS = {
  planned:     'Planned',
  booked:      'Booked',
  in_progress: 'In Progress',
  done:        'Done',
};

/**
 * TripNode — Single node in a TripGraph day timeline.
 *
 * Props:
 *  - node: { id, node_type, title, location, start_time, end_time, status,
 *            estimated_cost, linked_booking_id, linked_vehicle_id, notes }
 *  - isLast: boolean (hides the connecting line after it)
 *  - onAction: fn(node) — called on "Book Now" / "View Booking"
 *  - readOnly: boolean
 */
export default function TripNode({ node, isLast = false, onAction, readOnly = false }) {
  const navigate = useNavigate();
  const cfg = NODE_TYPE_CONFIG[node.node_type] || NODE_TYPE_CONFIG.activity;

  const handleBook = (e) => {
    e.stopPropagation();
    if (node.status === 'booked' || node.status === 'in_progress' || node.status === 'done') {
      if (node.linked_booking_id) navigate(`/bookings`);
      return;
    }
    if (onAction) {
      onAction(node);
    } else {
      navigate(cfg.route(node.linked_vehicle_id));
    }
  };

  const btnLabel = () => {
    if (node.status === 'booked') return 'View Booking';
    if (node.status === 'in_progress') return 'Track Live';
    if (node.status === 'done') return 'Completed ✓';
    return 'Book Now';
  };

  const formatTime = (t) => {
    if (!t) return '';
    try { return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch { return t; }
  };

  return (
    <div className="trip-node">
      {/* Timeline dot + line */}
      <div className="trip-node-timeline">
        <div className={`trip-node-dot type-${node.node_type}`}>
          {cfg.icon}
        </div>
        {!isLast && <div className="trip-node-line" />}
      </div>

      {/* Content */}
      <div className="trip-node-content">
        <div className="trip-node-title">{node.title || cfg.label}</div>

        {node.location && (
          <div className="trip-node-location">
            <MapPin size={12} />
            {node.location}
          </div>
        )}

        <div className="trip-node-meta">
          {/* Time */}
          {node.start_time && (
            <span className="trip-node-time">
              <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
              {formatTime(node.start_time)}
              {node.end_time && ` – ${formatTime(node.end_time)}`}
            </span>
          )}

          {/* Cost */}
          {node.estimated_cost > 0 && (
            <span className="trip-node-cost">
              ₹{Number(node.estimated_cost).toLocaleString('en-IN')}
            </span>
          )}

          {/* Status pill */}
          <span className={`trip-node-status ${node.status || 'planned'}`}>
            {STATUS_LABELS[node.status] || 'Planned'}
          </span>
        </div>

        {node.notes && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 6 }}>
            {node.notes}
          </div>
        )}

        {/* Linked Parcel Relay Sub-Node */}
        {node.linked_parcel_id && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate('/parcel');
            }}
            style={{
              marginTop: 8,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(240, 162, 2, 0.12)',
              border: '1px dashed var(--color-accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📦</span>
              <span style={{ fontWeight: 700, color: 'var(--color-accent-amber)' }}>
                Carrying Relay Parcel: {node.linked_parcel_id}
              </span>
            </div>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Track →</span>
          </div>
        )}
      </div>

      {/* Book / View button */}
      {!readOnly && node.status !== 'done' && (
        <button className="trip-node-book-btn" onClick={handleBook}>
          {btnLabel()}
        </button>
      )}
      {node.status === 'done' && (
        <span style={{ fontSize: '1.1rem', alignSelf: 'center' }}>✅</span>
      )}
    </div>
  );
}
