import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Ticket, Wallet, Package, Car, TrendingUp,
  ArrowRight, Clock, CheckCircle, Navigation, Bike
} from 'lucide-react';
import { useAuthStore, useWalletStore, useBookingStore, useVehicleStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { balance, isLoading: walletLoading } = useWalletStore();
  const { bookings, isLoading: bookingsLoading } = useBookingStore();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleStore();

  const isLoading = walletLoading || bookingsLoading || vehiclesLoading;

  const userBookings = (bookings || []).filter(b => b.user_id === user?.id);
  const activeBookings = userBookings.filter(b => b.status === 'confirmed');
  const completedBookings = userBookings.filter(b => b.status === 'completed');
  const activeVehicles = (vehicles || []).filter(v => v.approved && v.isActive);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { label: 'Search Trips', icon: Search, color: 'teal', path: '/search' },
    { label: 'Rent Bike/Scooty', icon: Bike, color: 'purple', path: '/rentals' },
    { label: 'My Bookings', icon: Ticket, color: 'blue', path: '/bookings' },
    { label: 'Wallet', icon: Wallet, color: 'amber', path: '/wallet' },
    { label: 'Send Parcel', icon: Package, color: 'green', path: '/parcel' },
    { label: 'Live Tracking', icon: Navigation, color: 'red', path: '/tracking' },
  ];

  const popularRoutes = [
    { from: 'Mumbai', to: 'Pune', price: '₹550', duration: '3h 30m', frequency: '12 trips/day', type: 'SUV' },
    { from: 'Delhi', to: 'Jaipur', price: '₹700', duration: '5h 30m', frequency: '10 trips/day', type: 'Bus' },
    { from: 'Bangalore', to: 'Chennai', price: '₹600', duration: '6h 30m', frequency: '6 trips/day', type: 'Bus' },
    { from: 'Mumbai', to: 'Goa', price: '₹1,200', duration: '10h', frequency: '4 trips/day', type: 'SUV' },
    { from: 'Mumbai', to: 'Ahmedabad', price: '₹850', duration: '9h 30m', frequency: '5 trips/day', type: 'Bus' },
    { from: 'Hyderabad', to: 'Bangalore', price: '₹900', duration: '10h', frequency: '4 trips/day', type: 'Bus' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>{greeting()}, {user?.name?.split(' ')[0] || 'Traveler'} 👋</h1>
        <p>Ready for your next adventure? Here's your travel overview.</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SkeletonLoader type="stats-card" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger-children">
          <div className="stat-card">
            <div className="stat-card-icon teal"><Wallet size={22} /></div>
            <div className="stat-card-label">Wallet Balance</div>
            <div className="stat-card-value">₹{balance.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon purple"><Ticket size={22} /></div>
            <div className="stat-card-label">Active Bookings</div>
            <div className="stat-card-value">{activeBookings.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green"><CheckCircle size={22} /></div>
            <div className="stat-card-label">Completed Trips</div>
            <div className="stat-card-value">{completedBookings.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue"><Car size={22} /></div>
            <div className="stat-card-label">Active Vehicles</div>
            <div className="stat-card-value">{activeVehicles.length}</div>
          </div>
        </div>
      )}

      {/* Quick Search */}
      <div className="glass-card mb-8 p-6">
        <h3 className="text-lg font-bold mb-4">
          <Search size={20} className="inline mr-2 align-text-bottom" />
          Quick Trip Search
        </h3>
        <div className="flex flex-col md:flex-row gap-3 w-full">
          <div className="w-full md:flex-1">
            <input className="form-input w-full" placeholder="From (e.g., Mumbai)" />
          </div>
          <div className="w-full md:flex-1">
            <input className="form-input w-full" placeholder="To (e.g., Pune)" />
          </div>
          <div className="w-full md:w-48">
            <input type="date" className="form-input w-full" />
          </div>
          <button className="btn btn-primary w-full md:w-auto justify-center" onClick={() => navigate('/search')}>
            <Search size={18} /> Search
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full mb-8 stagger-children">
        {quickActions.map(action => (
          <div
            key={action.label}
            className="glass-card clickable p-3 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(action.path)}
          >
            <div className={`stat-card-icon ${action.color} shrink-0`}>
              <action.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{action.label}</div>
            </div>
            <ArrowRight size={16} color="var(--color-text-tertiary)" className="shrink-0" />
          </div>
        ))}
      </div>

      {/* Popular Routes */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>Popular Routes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {popularRoutes.map((route, i) => (
          <div
            key={i}
            className="glass-card clickable"
            onClick={() => navigate('/search')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <MapPin size={16} color="var(--color-accent-teal-light)" />
              <span style={{ fontWeight: 600 }}>{route.from}</span>
              <ArrowRight size={14} color="var(--color-text-tertiary)" />
              <span style={{ fontWeight: 600 }}>{route.to}</span>
              <span className={`badge ${route.type === 'Bus' ? 'badge-purple' : 'badge-teal'}`} style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>
                {route.type === 'Bus' ? '🚌' : '🚗'} {route.type}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>
                <Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                {route.duration}
              </span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>{route.frequency}</span>
              <span style={{ fontWeight: 700, color: 'var(--color-accent-teal-light)' }}>{route.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
