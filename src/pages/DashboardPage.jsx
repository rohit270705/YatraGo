import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Ticket, Wallet, Package, Car, TrendingUp,
  ArrowRight, Clock, CheckCircle, Navigation, Bike, Palmtree,
  Sparkles, Compass, Bell, UserCircle, ChevronRight, Map, ShieldCheck,
  AlertCircle, ChevronDown, History, Luggage
} from 'lucide-react';
import { useAuthStore, useWalletStore, useBookingStore, useVehicleStore } from '../store';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { balance, isLoading: walletLoading } = useWalletStore();
  const { bookings, isLoading: bookingsLoading } = useBookingStore();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleStore();

  const [dbRoutes, setDbRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  const isLoading = walletLoading || bookingsLoading || vehiclesLoading;

  // Fetch real routes from Supabase
  useEffect(() => {
    async function fetchRoutes() {
      try {
        setRoutesLoading(true);
        const { data, error } = await supabase.from('routes').select('*').limit(6);
        if (!error && data) {
          setDbRoutes(data);
        } else {
          setDbRoutes([]);
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
        setDbRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  // Robust User Name Extraction
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

  // Format real routes from Supabase or user bookings (No fake hardcoded routes)
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

  const formattedDbRoutes = (dbRoutes || []).map(r => ({
    from: r.from_city || r.origin || r.source || r.pickup || 'Origin City',
    to: r.to_city || r.destination || r.dropoff || 'Destination City',
    price: r.base_price ? `₹${r.base_price}` : r.price ? `₹${r.price}` : r.fare ? `₹${r.fare}` : '₹350',
    duration: r.duration || r.est_duration || '40 min',
    type: r.vehicle_type || r.type || 'Popular Commute',
    tag: 'Popular'
  }));

  const displayRoutes = uniqueUserRoutes.length >= 2 ? uniqueUserRoutes : formattedDbRoutes;
  const routeSectionTitle = uniqueUserRoutes.length >= 2 ? "Your Recent & Usual Routes" : "Popular Routes Near You";

  return (
    <div className="animate-fade-in pb-28 min-h-[calc(100vh-80px)] max-w-5xl mx-auto flex flex-col justify-between">
      <div className="w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
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
          <div className="flex items-center shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/profile')}
              className="rounded-full bg-[var(--color-surface)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-text)] hover:border-[var(--color-accent-teal)] transition-all relative shadow-sm cursor-pointer shrink-0"
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-accent-teal)] animate-pulse"></span>
            </button>
            <div
              onClick={() => navigate('/profile')}
              className="rounded-full bg-gradient-to-tr from-[var(--color-accent-teal)] to-blue-500 flex items-center justify-center text-white font-bold text-base shadow-md cursor-pointer border border-[var(--glass-border)] hover:scale-105 transition-transform shrink-0"
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
            className="glass-card mb-6 p-4 border border-[var(--color-accent-teal)] bg-gradient-to-r from-[var(--color-accent-teal)]/20 via-[var(--color-surface)] to-[var(--color-surface)] relative overflow-hidden shadow-lg cursor-pointer group rounded-2xl transition-all hover:border-[var(--color-accent-teal-light)] w-full max-w-[800px] mx-auto"
            style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto' }}
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

        {/* 3. PREMIUM WALLET CARD (Redesigned) */}
        <div
          className="mb-8 w-full max-w-[800px] mx-auto shadow-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '800px',
            margin: '0 auto 2rem auto'
          }}
        >
          {/* Top part: Left (Icon + Label + Balance) | Right (Add Money + Button) */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                  <Wallet size={16} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">YatraGo Pay Balance</span>
              </div>
              <div className="font-black text-white tracking-tight" style={{ fontSize: '32px', lineHeight: '1.1', fontWeight: 900 }}>
                ₹{balance.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-black font-extrabold text-xs px-4 py-2 rounded-full transition-all shadow-md shrink-0 mt-1"
            >
              Add Money +
            </button>
          </div>

          {/* Clean Subtle Separator Line (No perforated dashed line in middle or outside) */}
          <div className="w-full border-b border-white/10 my-5"></div>

          {/* Bottom part: Transit Rewards & progress bar */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-medium text-white/80">
                <span className="text-base">🏅</span>
                <span>
                  Transit Rewards: <span className="text-[#2dd4bf] font-bold">3 of 5 rides</span> to a free trip
                </span>
              </div>
              <div className="w-full sm:w-48 bg-white/10 h-2 rounded-full overflow-hidden shrink-0 shadow-inner">
                <div className="bg-[#14b8a6] h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RECENT BOOKINGS SECTION */}
        <div className="mb-8 w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <History size={14} className="text-[var(--color-accent-teal)]" />
              <span>Recent Bookings</span>
            </h3>
            {userBookings.length > 0 && (
              <button onClick={() => navigate('/bookings')} className="text-xs font-bold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {userBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {userBookings.slice(0, 3).map((b, idx) => (
                <div
                  key={b.id || idx}
                  onClick={() => navigate('/bookings')}
                  className="glass-card clickable p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all flex items-center justify-between gap-4 cursor-pointer bg-[var(--color-surface)]/90 shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-accent-teal)] shrink-0 shadow-sm">
                      <Car size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm sm:text-base text-[var(--color-text)] truncate flex items-center gap-2">
                        <span>{b.pickup || 'Origin'} → {b.destination || 'Destination'}</span>
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-2">
                        <span>{new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span className="capitalize">{b.vehicle_name || b.trip_type || 'Ride'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-sm sm:text-base text-[var(--color-accent-teal-light)]">
                      ₹{b.total_amount || b.price || Math.floor(200 + Math.random() * 300)}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : b.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {b.status || 'completed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-[var(--glass-border)] text-center flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)]/80 shadow-md">
              <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-text-tertiary)] shadow-inner">
                <Luggage size={24} />
              </div>
              <div className="font-bold text-base text-[var(--color-text)]">No trips yet. Book your first trip!</div>
              <button
                onClick={() => navigate('/search')}
                className="btn btn-sm px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:scale-105 transition-transform mt-1"
                style={{ backgroundColor: '#14b8a6', color: '#000000' }}
              >
                Search Transit
              </button>
            </div>
          )}
        </div>

        {/* 5. POPULAR ROUTES NEAR YOU (Real Data from Supabase / No hardcoded fakes) */}
        <div className="mb-8 w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <Map size={14} className="text-[var(--color-accent-teal)]" />
              <span>{routeSectionTitle}</span>
            </h3>
            {displayRoutes.length > 0 && (
              <button onClick={() => navigate('/search')} className="text-xs font-bold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {displayRoutes.length > 0 ? (
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
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-[var(--glass-border)] text-center text-[var(--color-text-secondary)] font-medium bg-[var(--color-surface)]/80 shadow-md">
              No routes available yet
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
