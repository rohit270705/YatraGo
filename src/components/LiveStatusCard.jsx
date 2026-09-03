import { Car, Package, CheckCircle, Clock, AlertTriangle, Navigation } from 'lucide-react';

const STATUS_CONFIG = {
  driver_arriving: {
    type: 'active',
    icon: Car,
    title: 'Driver is on the way',
    defaultAction: 'Track',
  },
  parcel_out: {
    type: 'info',
    icon: Package,
    title: 'Parcel out for delivery',
    defaultAction: 'Track',
  },
  booking_confirmed: {
    type: 'success',
    icon: CheckCircle,
    title: 'Booking Confirmed!',
    defaultAction: 'View',
  },
  delay: {
    type: 'warning',
    icon: AlertTriangle,
    title: 'Delay Reported',
    defaultAction: 'Details',
  },
  go_now: {
    type: 'active',
    icon: Navigation,
    title: 'Time to Go!',
    defaultAction: 'Navigate',
  },
};

/**
 * LiveStatusCard — TripIt-style proactive alert card.
 *
 * Props:
 *  - statusType: 'driver_arriving' | 'parcel_out' | 'booking_confirmed' | 'delay' | 'go_now'
 *  - title: override title
 *  - description: string
 *  - time: string (e.g. "Arriving in 4 min")
 *  - actionLabel: string override
 *  - onAction: fn
 *  - showPulse: boolean (shows live green dot)
 */
export default function LiveStatusCard({
  statusType = 'booking_confirmed',
  title,
  description,
  time,
  actionLabel,
  onAction,
  showPulse = false,
}) {
  const cfg = STATUS_CONFIG[statusType] || STATUS_CONFIG.booking_confirmed;
  const Icon = cfg.icon;
  const cardTitle = title || cfg.title;
  const btnLabel = actionLabel || cfg.defaultAction;

  return (
    <div className={`live-status-card status-${cfg.type}`}>
      <div className="live-status-icon">
        <Icon size={18} />
      </div>
      <div className="live-status-content">
        <div className="live-status-title">
          {showPulse && <span className="live-status-pulse" />}
          {cardTitle}
        </div>
        {description && <div className="live-status-desc">{description}</div>}
        {time && <div className="live-status-time">{time}</div>}
      </div>
      {onAction && (
        <button className="live-status-action" onClick={onAction}>
          {btnLabel}
        </button>
      )}
    </div>
  );
}
