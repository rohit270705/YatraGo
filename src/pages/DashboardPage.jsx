import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Ticket, Wallet, Package, Car, TrendingUp,
  ArrowRight, Clock, CheckCircle, Navigation, Bike, Palmtree, Sparkles, Compass
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
    { label: 'Holiday Packages', icon: Palmtree, color: 'teal', path: '/packages' },
  ];

  const popularRoutes = [
    { from: 'Mumbai', to: 'Pune', price: '₹550', duration: '3h 30m', frequency: '12 trips/day', type: 'SUV' },
    { from: 'Delhi', to: 'Jaipur', price: '₹700', duration: '5h 30m', frequency: '10 trips/day', type: 'Bus' },
    { from: 'Bangalore', to: 'Chennai', price: '₹600', duration: '6h 30m', frequency: '6 trips/day', type: 'Bus' },
    { from: 'Mumbai', to: 'Goa', price: '₹1,200', duration: '10h', frequency: '4 trips/day', type: 'SUV' },
    { from: 'Mumbai', to: 'Ahmedabad', price: '₹850', duration: '9h 30m', frequency: '5 trips/day', type: 'Bus' },
    { from: 'Hyderabad', to: 'Bangalore', price: '₹900', duration: '10h', frequency: '4 trips/day', type: 'Bus' },
  ];

  const holidayPackages = [
    { name: 'Heritage', count: '15+ Packages', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=500&q=80', badge: 'Popular' },
    { name: 'Hill Station', count: '20+ Packages', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=500&q=80', badge: 'Cool Retreats' },
    { name: 'Beach', count: '12+ Packages', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80', badge: 'Relaxing' },
    { name: 'Spiritual', count: '18+ Packages', image: 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=500&q=80', badge: 'Divine' },
    { name: 'Wildlife', count: '10+ Packages', image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=500&q=80', badge: 'Adventure' },
    { name: 'Honeymoon', count: '14+ Packages', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=500&q=80', badge: 'Romantic' },
  ];

  return (
    <div className="animate-fade-in pb-12">
      {/* 1. TOP SEARCH BAR (Hero Section) */}
      <div className="glass-card mb-8 p-6 md:p-8 relative overflow-hidden border-[var(--color-accent-teal)]">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--color-accent-teal)] opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">
            {greeting()}, {user?.name?.split(' ')[0] || 'Traveler'} 👋
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
            Where would you like to travel today? Explore trips, rentals & holiday packages.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--glass-border)] shadow-lg">
          <div className="w-full md:flex-1 relative flex items-center">
            <MapPin size={18} className="absolute left-3.5 text-[var(--color-accent-teal)] pointer-events-none" />
            <input className="form-input w-full !pl-10 !bg-transparent !border-0 focus:!ring-0" placeholder="From (e.g., Mumbai)" />
          </div>
          <div className="hidden md:block w-[1px] bg-[var(--glass-border)] my-1"></div>
          <div className="w-full md:flex-1 relative flex items-center">
            <MapPin size={18} className="absolute left-3.5 text-[var(--color-accent-teal)] pointer-events-none" />
            <input className="form-input w-full !pl-10 !bg-transparent !border-0 focus:!ring-0" placeholder="To (e.g., Pune)" />
          </div>
          <div className="hidden md:block w-[1px] bg-[var(--glass-border)] my-1"></div>
          <div className="w-full md:w-48 relative flex items-center">
            <input type="date" className="form-input w-full !bg-transparent !border-0 focus:!ring-0 text-sm" />
          </div>
          <button className="btn btn-primary w-full md:w-auto justify-center px-8 shrink-0 shadow-md font-bold text-base" onClick={() => navigate('/search')}>
            <Search size={18} /> Search Trips
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS (below search) */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <SkeletonLoader type="stats-card" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 stagger-children">
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

      {/* 3. QUICK ACTIONS (icon + label style like MakeMyTrip navbar) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-accent-teal)]" />
            Explore Quick Actions
          </h3>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {quickActions.map(action => (
            <div
              key={action.label}
              className="glass-card clickable px-4 py-3.5 flex flex-col items-center justify-center cursor-pointer min-w-[110px] flex-1 shrink-0 hover:border-[var(--color-accent-teal)] transition-all group"
              onClick={() => navigate(action.path)}
            >
              <div className={`stat-card-icon ${action.color} mb-2.5 w-12 h-12 flex items-center justify-center rounded-full shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                <action.icon size={22} />
              </div>
              <span className="text-xs font-semibold text-center whitespace-nowrap text-[var(--color-text)] group-hover:text-[var(--color-accent-teal)] transition-colors">{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. POPULAR ROUTES (card style like MakeMyTrip listings) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Compass size={18} className="text-[var(--color-accent-teal)]" />
            Popular Routes
          </h3>
          <button className="text-xs font-semibold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1" onClick={() => navigate('/search')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {popularRoutes.map((route, i) => (
            <div
              key={i}
              className="glass-card clickable min-w-[280px] md:min-w-0 shrink-0 md:shrink p-4 hover:border-[var(--color-accent-teal)] transition-all flex flex-col justify-between"
              onClick={() => navigate('/search')}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <span className="text-[var(--color-text)]">{route.from}</span>
                    <ArrowRight size={14} className="text-[var(--color-accent-teal)]" />
                    <span className="text-[var(--color-text)]">{route.to}</span>
                  </div>
                  <span className={`badge ${route.type === 'Bus' ? 'badge-purple' : 'badge-teal'} text-[10px] px-2 py-0.5 font-semibold shrink-0`}>
                    {route.type === 'Bus' ? '🚌' : '🚗'} {route.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] border-t border-[var(--glass-border)] pt-3 mt-1">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-[var(--color-accent-teal)]" />
                  {route.duration}
                </span>
                <span>{route.frequency}</span>
                <span className="text-base font-extrabold text-[var(--color-accent-teal-light)]">{route.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. HOLIDAY PACKAGES SECTION (like MakeMyTrip destination grid) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Palmtree size={18} className="text-[var(--color-accent-teal)]" />
            Curated Holiday Packages
          </h3>
          <button className="text-xs font-semibold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1" onClick={() => navigate('/packages')}>
            Explore All <ArrowRight size={14} />
          </button>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {holidayPackages.map((pkg, idx) => (
            <div
              key={idx}
              className="glass-card clickable relative overflow-hidden rounded-xl min-w-[200px] sm:min-w-[220px] h-[250px] shrink-0 cursor-pointer group p-0 border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all shadow-md"
              onClick={() => navigate('/packages')}
            >
              <img
                src={pkg.image}
                alt={pkg.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-80 group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <span className="badge badge-teal self-start mb-2 text-[10px] py-0.5 px-2 font-semibold shadow-sm">{pkg.badge}</span>
                <h4 className="text-white font-extrabold text-lg leading-tight group-hover:text-[var(--color-accent-teal-light)] transition-colors">{pkg.name}</h4>
                <p className="text-gray-300 text-xs mt-0.5 font-medium">{pkg.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
