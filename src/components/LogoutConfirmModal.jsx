import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../store';

export default function LogoutConfirmModal() {
  const navigate = useNavigate();
  const { isLogoutModalOpen, closeLogoutConfirm, logout } = useAuthStore();

  if (!isLogoutModalOpen) return null;

  const handleConfirmLogout = async () => {
    await logout();
    closeLogoutConfirm();
    navigate('/login');
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 9, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={closeLogoutConfirm}
    >
      <div 
        className="glass-card animate-scale-in" 
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '28px 24px',
          textAlign: 'center',
          background: 'rgba(26, 35, 50, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(231, 76, 60, 0.15)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
            color: 'var(--color-accent-red)'
          }}
        >
          <LogOut size={30} />
        </div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Confirm Logout
        </h3>
        
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          Are you sure you want to log out?
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button 
            type="button"
            className="btn btn-ghost" 
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
            onClick={closeLogoutConfirm}
          >
            No, Stay
          </button>
          
          <button 
            type="button"
            className="btn btn-danger" 
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              fontWeight: 600,
              color: 'white',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              cursor: 'pointer',
              border: 'none'
            }}
            onClick={handleConfirmLogout}
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
