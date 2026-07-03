import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Map, Package, UserCircle } from 'lucide-react';
import { useAuthStore } from '../store';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const role = user?.role || 'passenger';
  if (role !== 'passenger') return null;

  const items = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/bookings', label: 'Trips', icon: Ticket },
    { path: '/tracking', label: 'Track', icon: Map },
    { path: '/parcel', label: 'Parcel', icon: Package },
    { path: '/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
