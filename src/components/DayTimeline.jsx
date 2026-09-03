import { Plus } from 'lucide-react';
import TripNode from './TripNode';

/**
 * DayTimeline — Wanderlog-style day-tab sidebar + node list.
 *
 * Props:
 *  - days: Array<{ dayNumber, date, nodes: TripNode[], totalCost }>
 *  - activeDay: number
 *  - onDaySelect: fn(dayNumber)
 *  - onAddNode: fn(dayNumber)
 *  - onNodeAction: fn(node)
 *  - readOnly: boolean (driver/agent view hides add button)
 */
export default function DayTimeline({
  days = [],
  activeDay = 1,
  onDaySelect,
  onAddNode,
  onNodeAction,
  readOnly = false,
}) {
  const currentDay = days.find(d => d.dayNumber === activeDay) || days[0];
  const nodes = currentDay?.nodes || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  };

  return (
    <div className="trip-graph-layout">
      {/* ── Day sidebar ── */}
      <div className="trip-day-sidebar">
        <div className="trip-day-sidebar-header">
          <div className="trip-day-sidebar-title">Your Itinerary</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {days.length} day{days.length !== 1 ? 's' : ''}
          </div>
        </div>

        {days.map(day => (
          <button
            key={day.dayNumber}
            className={`trip-day-tab${day.dayNumber === activeDay ? ' active' : ''}`}
            onClick={() => onDaySelect?.(day.dayNumber)}
          >
            <span className="trip-day-label">Day {day.dayNumber}</span>
            {day.date && <span className="trip-day-date">{formatDate(day.date)}</span>}
            {day.totalCost > 0 && (
              <span className="trip-day-cost">
                ₹{day.totalCost.toLocaleString('en-IN')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Node area ── */}
      <div className="trip-node-area">
        <div className="trip-node-area-header">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
            Day {activeDay} — {currentDay?.date ? formatDate(currentDay.date) : 'Plan your stops'}
          </div>
          {!readOnly && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              {nodes.length} stop{nodes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {nodes.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 180 }}>
            <div className="empty-state-icon">🗺️</div>
            <div className="empty-state-title">No stops yet for Day {activeDay}</div>
            <div className="empty-state-desc">
              {readOnly
                ? 'No activities planned for this day.'
                : 'Add a vehicle pickup, stay, food stop, or parcel drop to get started.'}
            </div>
          </div>
        ) : (
          nodes.map((node, idx) => (
            <TripNode
              key={node.id}
              node={node}
              isLast={idx === nodes.length - 1}
              onAction={onNodeAction}
              readOnly={readOnly}
            />
          ))
        )}

        {!readOnly && (
          <button
            className="trip-add-node-btn"
            onClick={() => onAddNode?.(activeDay)}
          >
            <Plus size={16} />
            Add a stop to Day {activeDay}
          </button>
        )}
      </div>
    </div>
  );
}
