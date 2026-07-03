import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Ticket, Wallet, Package, Car, TrendingUp,
  ArrowRight, Clock, CheckCircle, Navigation, Bike, Palmtree,
  Sparkles, Compass, Bell, UserCircle, ChevronRight, Map, ShieldCheck,
  AlertCircle, ChevronDown
} from 'lucide-react';
import { useAuthStore, useWalletStore, useBookingStore, useVehicleStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { balance, isLoading: walletLoading } = useWalletStore();
  const { bookings, isLoading: bookingsLoading } = useBookingStore();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleStore();

  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  const isLoading = walletLoading || bookingsLoading || vehiclesLoading;

  const userBookings = (bookings || []).filter(b => b.user_id === user?.id);
  const activeBookings = userBookings.filter(b => ['confirmed', 'in_progress', 'pending'].includes(b.status));
  const currentTrip = activeBookings.length > 0 ? activeBookings[0] : null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSwapRoutes = () => {
    const temp = originInput;
    setOriginInput(destinationInput);
    setDestinationInput(temp);
  };

  const transitActions = [
    { label: 'Book a ride', icon: Car, color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', path: '/search' },
    { label: 'Bus tickets', icon: Ticket, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', path: '/search' },
    { label: 'Hire a driver', icon: UserCircle, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', path: '/rentals' },
    { label: 'Rent a bike', icon: Bike, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', path: '/rentals' },
    { label: 'Send a parcel', icon: Package, color: 'bg-green-500/15 text-green-400 border-green-500/30', path: '/parcel' },
    { label: 'Holiday packages', icon: Palmtree, color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', path: '/packages' },
  ];

  const usualRoutes = [
    { from: 'Home (Andheri East)', to: 'Tech Park (Powai)', price: '₹180', duration: '25 min', type: 'Daily Commute', tag: 'Fastest' },
    { from: 'Office HQ', to: 'International Airport T2', price: '₹450', duration: '40 min', type: 'Airport Ride', tag: 'Popular' },
    { from: 'Residency (Bandra)', to: 'Railway Station (Dadar)', price: '₹120', duration: '20 min', type: 'Transit Connect', tag: 'Frequent' },
    { from: 'Main Campus', to: 'City Center Mall', price: '₹210', duration: '30 min', type: 'Weekend Ride', tag: 'Save 15%' },
    { from: 'Tech Park (Powai)', to: 'Home (Andheri East)', price: '₹180', duration: '30 min', type: 'Return Commute', tag: 'Evening' },
  ];

  return (
    <div className="animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* 1. GREETING HEADER */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            {greeting()}, {user?.name?.split(' ')[0] || 'Traveler'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium mt-0.5">
            Your personal transit & travel companion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-text)] hover:border-[var(--color-accent-teal)] transition-all relative shadow-sm"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-accent-teal)] animate-pulse"></span>
          </button>
          <div
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-accent-teal)] to-blue-500 flex items-center justify-center text-white font-bold text-base shadow-md cursor-pointer border-2 border-[var(--color-surface)] hover:scale-105 transition-transform"
            title="User Profile"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
          </div>
        </div>
      </div>

      {/* 2. LIVE TRIP STRIP (Only shown if active booking exists) */}
      {currentTrip && (
        <div
          onClick={() => navigate('/tracking')}
          className="glass-card mb-6 p-4 border border-[var(--color-accent-teal)] bg-gradient-to-r from-[var(--color-accent-teal)]/20 via-[var(--color-surface)] to-[var(--color-surface)] relative overflow-hidden shadow-lg cursor-pointer group rounded-2xl transition-all hover:border-[var(--color-accent-teal-light)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-teal)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-teal)]"></span>
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm sm:text-base text-[var(--color-text)] flex items-center gap-2 truncate">
                  <span>Your ride is 4 min away</span>
                  <span className="badge badge-teal text-[10px] uppercase font-bold py-0.5 px-2">Live</span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5 font-medium">
                  {currentTrip.vehicle_name || 'Toyota Innova SUV'} • <span className="font-mono text-[var(--color-accent-teal-light)] font-bold">{currentTrip.vehicle_number || 'MH 12 AB 3456'}</span> • {currentTrip.destination || 'On route'}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-[var(--color-accent-teal)] group-hover:translate-x-1 transition-transform">
              <span>Track</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      )}

      {/* 3. BOARDING-PASS SEARCH CARD */}
      <div className="glass-card mb-8 p-0 relative overflow-hidden border border-[var(--glass-border)] shadow-xl bg-[var(--color-surface)]/90 rounded-2xl">
        {/* Header tag */}
        <div className="bg-[var(--color-bg)]/40 px-5 py-2.5 border-b border-[var(--glass-border)] flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-accent-teal)] flex items-center gap-1.5">
            <Car size={13} /> Boarding Pass • Route Search
          </span>
          <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">TICKET #{Math.floor(100000 + Math.random() * 900000)}</span>
        </div>

        {/* Top section: From / To fields with circular swap icon */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 relative">
            <div className="w-full md:flex-1 relative flex items-center bg-[var(--color-bg)]/60 rounded-xl p-3.5 border border-[var(--glass-border)] focus-within:border-[var(--color-accent-teal)] transition-colors shadow-inner">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-accent-teal)] mr-3.5 shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-bold mb-0.5">Origin Point</div>
                <input
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base font-bold text-[var(--color-text)] focus:outline-none focus:ring-0 placeholder:text-[var(--color-text-tertiary)] placeholder:font-normal truncate"
                  placeholder="From (e.g., Mumbai, Airport T2)"
                />
              </div>
            </div>

            {/* Circular Swap Icon */}
            <div className="flex justify-center z-10 -my-3 md:my-0 md:-mx-4 shrink-0">
              <button
                type="button"
                onClick={handleSwapRoutes}
                className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--glass-border)] shadow-md flex items-center justify-center text-[var(--color-accent-teal)] hover:rotate-180 hover:bg-[var(--color-accent-teal)] hover:text-black transition-all duration-300"
                title="Swap Origin and Destination"
              >
                <ArrowRight size={18} className="rotate-90 md:rotate-0" />
              </button>
            </div>

            <div className="w-full md:flex-1 relative flex items-center bg-[var(--color-bg)]/60 rounded-xl p-3.5 border border-[var(--glass-border)] focus-within:border-[var(--color-accent-teal)] transition-colors shadow-inner">
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-accent-teal)] mr-3.5 shrink-0 shadow-sm shadow-teal-500/50"></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-bold mb-0.5">Destination Point</div>
                <input
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base font-bold text-[var(--color-text)] focus:outline-none focus:ring-0 placeholder:text-[var(--color-text-tertiary)] placeholder:font-normal truncate"
                  placeholder="To (e.g., Pune, Tech Park)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Dashed Divider with Notches */}
        <div className="relative flex items-center justify-between w-full">
          <div className="w-6 h-6 rounded-full bg-[var(--color-bg)] -ml-3 border-r border-[var(--glass-border)] shadow-inner z-10"></div>
          <div className="flex-1 border-b-2 border-dashed border-[var(--glass-border)] mx-2"></div>
          <div className="w-6 h-6 rounded-full bg-[var(--color-bg)] -mr-3 border-l border-[var(--glass-border)] shadow-inner z-10"></div>
        </div>

        {/* Bottom section: Date picker pill + Search button below dashed line */}
        <div className="p-5 sm:p-6 bg-[var(--color-bg)]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex items-center">
            <div className="bg-[var(--color-surface)] border border-[var(--glass-border)] rounded-full px-4 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)] shadow-sm w-full sm:w-auto justify-center">
              <Clock size={16} className="text-[var(--color-accent-teal)] shrink-0" />
              <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-[var(--color-text-tertiary)]">•</span>
              <input type="time" defaultValue="10:00" className="bg-transparent border-0 p-0 text-xs sm:text-sm text-[var(--color-text)] focus:outline-none focus:ring-0 font-bold cursor-pointer" />
            </div>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="btn btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:scale-[1.02] transition-transform shrink-0"
          >
            <Search size={18} />
            <span>Search Transit</span>
          </button>
        </div>
      </div>

      {/* 4. QUICK ACTIONS as a horizontally scrollable chip rail */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[var(--color-accent-teal)]" />
          <span>Quick Transit Actions</span>
        </h3>
        <div className="flex overflow-x-auto gap-3.5 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {transitActions.map((action, idx) => (
            <div
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center cursor-pointer group min-w-[88px] flex-1 shrink-0"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.color} border flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300`}>
                <action.icon size={24} />
              </div>
              <span className="text-xs font-bold text-center text-[var(--color-text)] group-hover:text-[var(--color-accent-teal)] transition-colors whitespace-nowrap">{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. WALLET CARD styled as a ticket stub */}
      <div className="glass-card mb-8 p-0 relative overflow-hidden border border-[var(--glass-border)] shadow-md bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface)]/70 rounded-2xl">
        {/* Balance on top */}
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <Wallet size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">YatraGo Pay Balance</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] mt-0.5 tracking-tight">₹{balance.toLocaleString()}</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="btn btn-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Add Money</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Dashed Perforation Divider */}
        <div className="relative flex items-center justify-between w-full">
          <div className="w-5 h-5 rounded-full bg-[var(--color-bg)] -ml-2.5 border-r border-[var(--glass-border)] shadow-inner z-10"></div>
          <div className="flex-1 border-b-2 border-dashed border-[var(--glass-border)] mx-2"></div>
          <div className="w-5 h-5 rounded-full bg-[var(--color-bg)] -mr-2.5 border-l border-[var(--glass-border)] shadow-inner z-10"></div>
        </div>

        {/* Streak / rewards line with progress bar */}
        <div className="p-4 sm:px-6 bg-[var(--color-bg)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-500/30 shrink-0">🎁</span>
            <span className="font-medium text-[var(--color-text)]">Transit Rewards: <span className="text-[var(--color-accent-teal-light)] font-bold">3 of 5 rides</span> to a free trip</span>
          </div>
          <div className="w-full sm:w-40 bg-[var(--glass-border)] h-2 rounded-full overflow-hidden shrink-0">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      {/* 6. "YOUR USUAL ROUTES" */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
            <Map size={14} className="text-[var(--color-accent-teal)]" />
            <span>Your Usual Routes</span>
          </h3>
          <button onClick={() => navigate('/search')} className="text-xs font-bold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {usualRoutes.map((route, i) => (
            <div
              key={i}
              onClick={() => navigate('/search')}
              className="glass-card clickable p-4 rounded-2xl min-w-[270px] sm:min-w-[290px] shrink-0 border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all cursor-pointer flex flex-col justify-between group bg-[var(--color-surface)]/90 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2.5">
                  <span className="text-[var(--color-text-secondary)]">{route.type}</span>
                  <span className="badge badge-teal px-2 py-0.5 text-[9px] font-extrabold">{route.tag}</span>
                </div>

                {/* Route Line Motif: Origin --dashed line--> Destination */}
                <div className="flex items-center justify-between gap-2 my-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-3 h-3 rounded-full border-2 border-[var(--color-accent-teal)] shrink-0"></div>
                    <span className="font-extrabold text-sm sm:text-base text-[var(--color-text)] truncate">{route.from}</span>
                  </div>

                  <div className="flex items-center gap-1 px-1 shrink-0 text-[var(--color-accent-teal)] group-hover:scale-110 transition-transform">
                    <div className="w-6 sm:w-8 border-b-2 border-dashed border-[var(--color-accent-teal)]"></div>
                    <ArrowRight size={14} />
                  </div>

                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="font-extrabold text-sm sm:text-base text-[var(--color-text)] truncate">{route.to}</span>
                    <div className="w-3 h-3 rounded-full bg-[var(--color-accent-teal)] shrink-0 shadow-sm shadow-teal-500/50"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-3 mt-2 text-xs">
                <span className="text-[var(--color-text-secondary)] font-medium flex items-center gap-1">
                  <Clock size={13} className="text-[var(--color-accent-teal)]" />
                  {route.duration}
                </span>
                <span className="font-black text-base sm:text-lg text-[var(--color-accent-teal-light)] group-hover:scale-105 transition-transform">{route.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
