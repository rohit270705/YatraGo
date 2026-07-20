import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import NotificationBell from './NotificationBell';

export default function DashboardHeader({ subtitle = "Your personal transit & travel companion" }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Traveller';
  const displayGreetingName = user?.preferredGreetingName || user?.preferred_greeting_name || firstName;

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 32px 14px',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '84px'
    }}>
      {/* Center — greeting */}
      <div style={{ textAlign: 'center', margin: '0 auto' }}>
        <h1 style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: 0,
          fontSize: '1.45rem',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          flexWrap: 'wrap'
        }}>
          <span>{greeting()}, {displayGreetingName}</span>
          <span>👋</span>
        </h1>
        <p style={{
          margin: '4px 0 0',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          textAlign: 'center'
        }}>
          {subtitle}
        </p>
      </div>

      {/* Right — Bell + Profile pinned to absolute top right on desktop */}
      <div className="dashboard-header-right" style={{
        position: 'absolute',
        right: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <NotificationBell
          buttonClassName="rounded-full bg-[var(--color-surface)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-text)] hover:border-[var(--color-accent-teal)] transition-all relative shadow-sm cursor-pointer shrink-0"
          buttonStyle={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          iconSize={18}
        />
        <div
          onClick={() => navigate('/profile')}
          className="rounded-full bg-gradient-to-tr from-[var(--color-accent-teal)] to-blue-500 flex items-center justify-center text-white font-bold text-base shadow-md cursor-pointer border border-[var(--glass-border)] hover:scale-105 transition-transform shrink-0"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={user?.name || 'Profile'}
        >
          {firstName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
