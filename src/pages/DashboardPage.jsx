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

  // 1. Robust User Name Extraction
  const userName = user?.name || user?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Traveler';
  const firstName = userName !== 'Traveler' ? userName.split(' ')[0] : 'Traveler';

  // Live trip detection
  const userBookings = (bookings || []).filter(b => b.user_id === user?.id);
  const activeBookings = userBookings.filter(b => ['confirmed', 'in_progress', 'pending'].includes(b.status));
  const currentTrip = activeBookings.length > 0 ? activeBookings[0] : null;

  // Time greeting
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

  // 2. Quick Actions with Explicit Tinted Colors
  const transitActions = [
    { 
      label: 'Book a ride', icon: Car, path: '/search',
      bgStyle: 'rgba(20, 184, 166, 0.22)', borderStyle: 'rgba(20, 184, 166, 0.45)', colorStyle: '#2dd4bf'
    },
    { 
      label: 'Bus tickets', icon: Ticket, path: '/search',
      bgStyle: 'rgba(168, 85, 247, 0.22)', borderStyle: 'rgba(168, 85, 247, 0.45)', colorStyle: '#c084fc'
    },
    { 
      label: 'Hire a driver', icon: UserCircle, path: '/rentals',
      bgStyle: 'rgba(59, 130, 246, 0.22)', borderStyle: 'rgba(59, 130, 246, 0.45)', colorStyle: '#60a5fa'
    },
    { 
      label: 'Rent a bike', icon: Bike, path: '/rentals',
      bgStyle: 'rgba(245, 158, 11, 0.22)', borderStyle: 'rgba(245, 158, 11, 0.45)', colorStyle: '#fbbf24'
    },
    { 
      label: 'Send a parcel', icon: Package, path: '/parcel',
      bgStyle: 'rgba(34, 197, 94, 0.22)', borderStyle: 'rgba(34, 197, 94, 0.45)', colorStyle: '#4ade80'
    },
    { 
      label: 'Holiday packages', icon: Palmtree, path: '/packages',
      bgStyle: 'rgba(244, 63, 94, 0.22)', borderStyle: 'rgba(244, 63, 94, 0.45)', colorStyle: '#fb7185'
    },
  ];

  // 4. Real User Routes vs Popular Routes Near You
  const recentUserRoutes = (userBookings || [])
    .filter(b => b.pickup && b.destination)
    .map(b => ({
      from: b.pickup,
      to: b.destination,
      price: `₹${b.total_amount || b.price || Math.floor(150 + Math.random() * 300)}`,
      duration: `${b.duration || '25 min'}`,
      type: b.trip_type || 'Recent Ride',
      tag: 'Repeat Route'
    }));

  const uniqueUserRoutes = [];
  const seenRoutes = new Set();
  recentUserRoutes.forEach(r => {
    const key = `${r.from} -> ${r.to}`;
    if (!seenRoutes.has(key)) {
      seenRoutes.add(key);
      uniqueUserRoutes.push(r);
    }
  });

  const fallbackRoutes = [
    { from: 'Mumbai Airport (T2)', to: 'Bandra West (BKC)', price: '₹450', duration: '35 min', type: 'Airport Express', tag: 'Fastest' },
    { from: 'Indiranagar', to: 'Electronic City Tech Park', price: '₹320', duration: '45 min', type: 'Tech Commute', tag: 'Popular' },
    { from: 'Connaught Place', to: 'Cyber City (Gurugram)', price: '₹380', duration: '40 min', type: 'Intercity Ride', tag: 'Frequent' },
    { from: 'Salt Lake Sector V', to: 'Howrah Railway Station', price: '₹240', duration: '30 min', type: 'Station Transfer', tag: 'Save 15%' },
    { from: 'Koramangala', to: 'Kempegowda Int. Airport', price: '₹850', duration: '60 min', type: 'Airport Direct', tag: '24/7 Service' },
  ];

  const displayRoutes = uniqueUserRoutes.length >= 2 ? uniqueUserRoutes : fallbackRoutes;
  const routeSectionTitle = uniqueUserRoutes.length >= 2 ? "Your Recent & Usual Routes" : "Popular Routes Near You";

  return (
    <div className="animate-fade-in pb-28 min-h-[calc(100vh-80px)] max-w-5xl mx-auto flex flex-col justify-between">
      <div>
        {/* 1. GREETING HEADER */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              {greeting()}, {firstName} 👋
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
              title={userName}
            >
              {firstName.charAt(0).toUpperCase()}
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

        {/* 3 & 6. BOARDING-PASS SEARCH CARD (With Subtle Glassmorphism & Prominent Teal Stamp) */}
        <div
          className="mb-8 p-0 relative rounded-2xl shadow-2xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Header tag with prominent teal TICKET # stamp */}
          <div className="bg-black/25 px-5 py-3 border-b border-white/10 flex items-center justify-between rounded-t-2xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#2dd4bf] flex items-center gap-2">
              <Car size={15} className="text-[#2dd4bf]" /> Boarding Pass • Route Search
            </span>
            <div className="bg-[#14b8a6]/25 border border-[#14b8a6]/60 px-3 py-1 rounded-full shadow-md">
              <span className="text-xs font-mono font-black text-[#2dd4bf] tracking-wider">TICKET #{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
          </div>

          {/* Top section: From / To fields with circular swap icon */}
          <div className="p-5 sm:p-6 relative">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 relative">
              <div className="w-full md:flex-1 relative flex items-center bg-[#0b1329]/80 rounded-xl p-3.5 border border-white/10 focus-within:border-[#2dd4bf] transition-colors shadow-inner">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#2dd4bf] mr-3.5 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-0.5">Origin Point</div>
                  <input
                    value={originInput}
                    onChange={(e) => setOriginInput(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-sm sm:text-base font-bold text-white focus:outline-none focus:ring-0 placeholder:text-white/40 placeholder:font-normal truncate"
                    placeholder="From (e.g., Mumbai, Airport T2)"
                  />
                </div>
              </div>

              {/* Circular Swap Icon */}
              <div className="flex justify-center z-10 -my-3 md:my-0 md:-mx-4 shrink-0">
                <button
                  type="button"
                  onClick={handleSwapRoutes}
                  className="w-10 h-10 rounded-full bg-[#0f1936] border border-white/20 shadow-lg flex items-center justify-center text-[#2dd4bf] hover:rotate-180 hover:bg-[#2dd4bf] hover:text-black transition-all duration-300"
                  title="Swap Origin and Destination"
                >
                  <ArrowRight size={18} className="rotate-90 md:rotate-0" />
                </button>
              </div>

              <div className="w-full md:flex-1 relative flex items-center bg-[#0b1329]/80 rounded-xl p-3.5 border border-white/10 focus-within:border-[#2dd4bf] transition-colors shadow-inner">
                <div className="w-3.5 h-3.5 rounded-full bg-[#2dd4bf] mr-3.5 shrink-0 shadow-sm shadow-teal-500/50"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-0.5">Destination Point</div>
                  <input
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-sm sm:text-base font-bold text-white focus:outline-none focus:ring-0 placeholder:text-white/40 placeholder:font-normal truncate"
                    placeholder="To (e.g., Pune, Tech Park)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Perforated Dashed Divider with Cutout Notches */}
          <div className="relative flex items-center justify-between w-full my-1 py-1">
            {/* Left Cutout Notch */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b1329] border border-white/20 z-20 shadow-inner"></div>
            {/* Dashed Line */}
            <div className="w-full border-b-2 border-dashed border-white/25 mx-4"></div>
            {/* Right Cutout Notch */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b1329] border border-white/20 z-20 shadow-inner"></div>
          </div>

          {/* Bottom section: Date picker pill + Search button below dashed line */}
          <div className="p-5 sm:p-6 bg-black/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-b-2xl">
            <div className="w-full sm:w-auto flex items-center">
              <div className="bg-[#0f1936] border border-white/15 rounded-full px-4 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm w-full sm:w-auto justify-center">
                <Clock size={16} className="text-[#2dd4bf] shrink-0" />
                <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="text-white/40">•</span>
                <input type="time" defaultValue="10:00" className="bg-transparent border-0 p-0 text-xs sm:text-sm text-white focus:outline-none focus:ring-0 font-bold cursor-pointer" />
              </div>
            </div>

            <button
              onClick={() => navigate('/search')}
              className="btn w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform shrink-0"
              style={{
                backgroundColor: '#14b8a6',
                color: '#000000',
                boxShadow: '0 10px 25px rgba(20, 184, 166, 0.35)'
              }}
            >
              <Search size={18} />
              <span>Search Transit</span>
            </button>
          </div>
        </div>

        {/* 4. QUICK ACTIONS with Vibrant Distinct Tinted Backgrounds */}
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
                <div
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-2 shadow-md group-hover:scale-105 transition-all duration-300"
                  style={{
                    backgroundColor: action.bgStyle,
                    borderColor: action.borderStyle,
                    color: action.colorStyle
                  }}
                >
                  <action.icon size={26} />
                </div>
                <span className="text-xs font-bold text-center text-[var(--color-text)] group-hover:text-[var(--color-accent-teal)] transition-colors whitespace-nowrap">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. WALLET CARD styled as a ticket stub with Authentic Cutouts */}
        <div className="glass-card mb-8 p-0 relative rounded-2xl border border-[var(--glass-border)] shadow-xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface)]/80">
          {/* Balance on top */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
                <Wallet size={28} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">YatraGo Pay Balance</div>
                <div className="text-2xl sm:text-3xl font-black text-[var(--color-text)] mt-0.5 tracking-tight">₹{balance.toLocaleString()}</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="btn btn-sm bg-amber-500/25 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <span>Add Money</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Perforated Dashed Divider with Cutout Notches */}
          <div className="relative flex items-center justify-between w-full my-1 py-1">
            {/* Left Cutout Notch */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b1329] border border-[var(--glass-border)] z-20 shadow-inner"></div>
            {/* Dashed Line */}
            <div className="w-full border-b-2 border-dashed border-white/20 mx-4"></div>
            {/* Right Cutout Notch */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b1329] border border-[var(--glass-border)] z-20 shadow-inner"></div>
          </div>

          {/* Streak / rewards line with progress bar */}
          <div className="p-4 sm:px-6 bg-[var(--color-bg)]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs rounded-b-2xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/25 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/40 shrink-0 shadow-sm">🎁</span>
              <span className="font-semibold text-[var(--color-text)]">Transit Rewards: <span className="text-[var(--color-accent-teal-light)] font-extrabold">3 of 5 rides</span> to a free trip</span>
            </div>
            <div className="w-full sm:w-40 bg-[var(--glass-border)] h-2.5 rounded-full overflow-hidden shrink-0 shadow-inner">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>

        {/* 6. "YOUR USUAL ROUTES" (Real Data vs Popular Near You) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <Map size={14} className="text-[var(--color-accent-teal)]" />
              <span>{routeSectionTitle}</span>
            </h3>
            <button onClick={() => navigate('/search')} className="text-xs font-bold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {displayRoutes.map((route, i) => (
              <div
                key={i}
                onClick={() => navigate('/search')}
                className="glass-card clickable p-4 rounded-2xl min-w-[270px] sm:min-w-[290px] shrink-0 border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all cursor-pointer flex flex-col justify-between group bg-[var(--color-surface)]/90 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2.5">
                    <span className="text-[var(--color-text-secondary)]">{route.type}</span>
                    <span className="badge badge-teal px-2 py-0.5 text-[9px] font-black">{route.tag}</span>
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
    </div>
  );
}
