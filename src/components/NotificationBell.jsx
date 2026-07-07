import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../store';

export default function NotificationBell({ 
  buttonClassName = "btn btn-ghost btn-icon", 
  buttonStyle = { position: 'relative' }, 
  iconSize = 24 
}) {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const bellRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when user clicks outside the bell area
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.reference_type === 'vehicle_approved') {
      navigate('/vehicles');
    }
  };

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      <button
        className={buttonClassName}
        onClick={() => setIsOpen(prev => !prev)}
        style={{ ...buttonStyle, position: 'relative' }}
        aria-label="Notifications"
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--color-accent-red)', color: 'white',
            fontSize: '10px', fontWeight: 'bold',
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
          border: 'var(--border-subtle)', zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: 'var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {(!notifications || notifications.length === 0) ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                No new notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px', borderBottom: 'var(--border-subtle)',
                    background: notif.is_read ? 'transparent' : 'rgba(27, 153, 139, 0.05)',
                    cursor: 'pointer', display: 'flex', gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--color-accent-teal)', marginTop: 6,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
