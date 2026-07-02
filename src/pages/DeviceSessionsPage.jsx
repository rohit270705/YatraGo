import { useState } from 'react';
import { Monitor, Smartphone, Laptop, Trash2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';

export default function DeviceSessionsPage() {
  const { activeSessions, removeSession } = useAuthStore();
  const { addToast } = useToastStore();

  const getDeviceIcon = (platform) => {
    if (platform?.includes('Windows')) return <Monitor size={24} />;
    if (platform?.includes('Android')) return <Smartphone size={24} />;
    return <Laptop size={24} />;
  };

  const handleRemoveSession = (deviceId) => {
    removeSession(deviceId);
    addToast('Device session terminated', 'success');
  };

  const maxDevices = 4;
  const remainingSlots = maxDevices - activeSessions.length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Active Devices</h1>
        <p>Manage your logged-in devices (max {maxDevices} allowed)</p>
      </div>

      {/* Device Limit Card */}
      <div className="glass-card" style={{ marginBottom: 24, padding: 'var(--space-xl)' }}>
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: activeSessions.length >= maxDevices ? 'rgba(231, 76, 60, 0.12)' : 'rgba(46, 204, 113, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={28} color={activeSessions.length >= maxDevices ? 'var(--color-accent-red)' : 'var(--color-accent-green)'} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Device Login Limit</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              Your account can be logged in on a maximum of <strong>{maxDevices} devices</strong> simultaneously.
              {activeSessions.length >= maxDevices
                ? ' You have reached the limit. Remove a device to log in elsewhere.'
                : ` You have ${remainingSlots} slot${remainingSlots > 1 ? 's' : ''} remaining.`
              }
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem', fontWeight: 800,
              color: activeSessions.length >= maxDevices ? 'var(--color-accent-red)' : 'var(--color-accent-teal-light)',
            }}>
              {activeSessions.length}/{maxDevices}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Devices Active</div>
          </div>
        </div>

        {/* Visual device slots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {Array.from({ length: maxDevices }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 'var(--radius-full)',
              background: i < activeSessions.length
                ? (activeSessions.length >= maxDevices ? 'var(--color-accent-red)' : 'var(--color-accent-teal)')
                : 'var(--color-surface-elevated)',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>
      </div>

      {/* Warning if at max */}
      {activeSessions.length >= maxDevices && (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24,
          background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertTriangle size={20} color="var(--color-accent-red)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-accent-red)', marginBottom: 2 }}>
              Maximum devices reached!
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              A 5th login attempt will be blocked. Remove a device session below to free up a slot.
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Active Sessions</h3>
      {activeSessions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--color-text-tertiary)' }}>No active sessions recorded.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
          {activeSessions.map((session, i) => (
            <div key={session.deviceId} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: i === 0 ? 'rgba(27, 153, 139, 0.12)' : 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i === 0 ? 'var(--color-accent-teal-light)' : 'var(--color-text-tertiary)',
                }}>
                  {getDeviceIcon(session.platform)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{session.deviceName}</span>
                    {i === 0 && <span className="badge badge-teal" style={{ fontSize: '0.6rem' }}>This Device</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    Platform: {session.platform} • ID: {session.deviceId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    Login: {new Date(session.loginAt).toLocaleString()} • Last active: {new Date(session.lastActive).toLocaleString()}
                  </div>
                </div>
                {i > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveSession(session.deviceId)}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info section */}
      <div className="glass-card" style={{ marginTop: 24, padding: 'var(--space-lg)' }}>
        <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9375rem' }}>
          <Shield size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          About Device Restrictions
        </h4>
        <ul style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Maximum <strong>4 devices</strong> can be logged in simultaneously</li>
          <li>5th login attempt will be <strong>blocked</strong> automatically</li>
          <li>You can remotely terminate sessions from this page</li>
          <li>Sessions are tracked by unique device ID and platform</li>
          <li>For security, we recommend removing devices you no longer use</li>
        </ul>
      </div>
    </div>
  );
}
