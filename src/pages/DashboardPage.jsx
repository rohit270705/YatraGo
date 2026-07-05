import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Ticket, Wallet, Package, Car, TrendingUp,
  ArrowRight, Clock, CheckCircle, Navigation, Bike, Palmtree,
  Sparkles, Compass, Bell, UserCircle, ChevronRight, Map, ShieldCheck,
  Calendar, Star, Award, DollarSign, ArrowRightLeft, History
} from 'lucide-react';
import { useAuthStore, useWalletStore, useBookingStore, useVehicleStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { balance, isLoading: walletLoading } = useWalletStore();
  const { bookings, isLoading: bookingsLoading } = useBookingStore();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const addToast = useToastStore(s => s.addToast);

  const [dbRoutes, setDbRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [customGreetingInput, setCustomGreetingInput] = useState('');

  // Quick search widget state
  const [quickFrom, setQuickFrom] = useState('');
  const [quickTo, setQuickTo] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);

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
  const displayGreetingName = user?.preferredGreetingName || user?.preferred_greeting_name || firstName;

  const handleSaveGreeting = async (e) => {
    e?.preventDefault();
    const val = customGreetingInput.trim() || null;
    await updateProfile({ preferredGreetingName: val });
    setIsEditingGreeting(false);
    addToast(val ? 'Greeting updated!' : 'Greeting reset to default', 'success');
  };

  const handleResetGreeting = async () => {
    await updateProfile({ preferredGreetingName: null });
    setIsEditingGreeting(false);
    addToast('Greeting reset to default', 'success');
  };

  const handleQuickSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (quickFrom) params.set('from', quickFrom);
    if (quickTo) params.set('to', quickTo);
    if (quickDate) params.set('date', quickDate);
    navigate(`/search?${params.toString()}`);
  };

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

  // Format unique user routes for Recent Searches section
  const recentUserRoutes = (userBookings || [])
    .filter(b => b.pickup && b.destination)
    .map(b => ({
      from: b.pickup,
      to: b.destination,
      date: b.created_at || Date.now(),
      price: `₹${b.total_amount || b.price || Math.floor(150 + Math.random() * 300)}`,
      duration: `${b.duration || '25 min'}`,
      type: b.trip_type || 'Ride'
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

  // Pre-populated Indian Popular Routes fallback
  const fallbackPopularRoutes = [
    { from: 'Mumbai', to: 'Pune', duration: '3h 30m', price: '₹550', type: 'Intercity Express', tag: 'Popular' },
    { from: 'Delhi', to: 'Agra', duration: '3h', price: '₹400', type: 'Highway Shuttle', tag: 'Popular' },
    { from: 'Bangalore', to: 'Mysuru', duration: '3h', price: '₹350', type: 'Intercity Bus', tag: 'Popular' },
    { from: 'Chennai', to: 'Pondicherry', duration: '3h 30m', price: '₹300', type: 'Coastal Ride', tag: 'Popular' }
  ];

  const popularRoutes = (dbRoutes && dbRoutes.length > 0)
    ? dbRoutes.map(r => ({
        from: r.from_city || r.origin || r.source || r.pickup || 'Origin City',
        to: r.to_city || r.destination || r.dropoff || 'Destination City',
        price: r.base_price ? `₹${r.base_price}` : r.price ? `₹${r.price}` : r.fare ? `₹${r.fare}` : '₹350',
        duration: r.duration || r.est_duration || '3h',
        type: r.vehicle_type || r.type || 'Intercity',
        tag: 'Popular'
      }))
    : fallbackPopularRoutes;

  return (
    <div className="animate-fade-in pb-28 min-h-[calc(100vh-80px)] w-full max-w-5xl mx-auto flex flex-col justify-between" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div className="w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* 1. GREETING HEADER */}
        <div className="flex items-center justify-between mb-4 pt-2">
          <div>
            <div className="flex items-center gap-2 relative flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text)] flex items-center gap-2 flex-wrap">
                <span>{greeting()}, {displayGreetingName}</span>
                <span>👋</span>
              </h1>
            </div>
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

        {/* 2. QUICK SEARCH WIDGET (Compact, below greeting) */}
        <div
          className="mb-6 rounded-2xl shadow-lg mx-auto text-left w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px 20px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            width: '100%',
            maxWidth: '700px',
            boxSizing: 'border-box'
          }}
        >
          <form onSubmit={handleQuickSearch}>
            {/* Row 1: From and To inputs with swap icon */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3 w-full">
              <div className="flex items-center gap-2 flex-1 bg-[var(--color-bg)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2.5 min-w-0 w-full box-border">
                <MapPin size={16} className="text-[var(--color-accent-teal)] shrink-0" />
                <input
                  type="text"
                  placeholder="From (e.g. Mumbai)"
                  value={quickFrom}
                  onChange={(e) => setQuickFrom(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--color-text)] w-full placeholder-[var(--color-text-tertiary)] truncate"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const temp = quickFrom;
                  setQuickFrom(quickTo);
                  setQuickTo(temp);
                }}
                className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--glass-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-accent-teal)] transition-all shrink-0 cursor-pointer flex items-center justify-center self-center sm:self-auto"
                title="Swap Origin & Destination"
              >
                <ArrowRightLeft size={16} className="rotate-90 sm:rotate-0 transition-transform" />
              </button>

              <div className="flex items-center gap-2 flex-1 bg-[var(--color-bg)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2.5 min-w-0 w-full box-border">
                <Navigation size={16} className="text-[#3b82f6] shrink-0" />
                <input
                  type="text"
                  placeholder="To (e.g. Pune)"
                  value={quickTo}
                  onChange={(e) => setQuickTo(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--color-text)] w-full placeholder-[var(--color-text-tertiary)] truncate"
                />
              </div>
            </div>

            {/* Row 2: Date Picker */}
            <div className="flex items-center gap-2 w-full bg-[var(--color-bg)]/80 border border-[var(--glass-border)] rounded-xl px-3 py-2.5 mb-3 min-w-0 box-border">
              <Calendar size={16} className="text-[var(--color-text-secondary)] shrink-0" />
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--color-text)] cursor-pointer w-full font-medium"
              />
            </div>

            {/* Row 3: Full Width Search Button below */}
            <button
              type="submit"
              className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-black font-extrabold text-sm py-3 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer box-border"
            >
              <Search size={18} />
              <span>Search Transit</span>
            </button>
          </form>
        </div>

        {/* 3. LIVE TRIP STRIP (Only shown if active booking exists) */}
        {currentTrip && (
          <div
            onClick={() => navigate('/tracking')}
            className="glass-card mb-6 p-4 border border-[var(--color-accent-teal)] bg-gradient-to-r from-[var(--color-accent-teal)]/20 via-[var(--color-surface)] to-[var(--color-surface)] relative overflow-hidden shadow-lg cursor-pointer group rounded-2xl transition-all hover:border-[var(--color-accent-teal-light)] w-full max-w-[800px] mx-auto"
            style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto', width: '100%', boxSizing: 'border-box' }}
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

        {/* 4. PREMIUM WALLET CARD WITH PROMINENT REWARDS */}
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
            margin: '0 auto 2rem auto',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Top half: Left (Icon + Label + Balance) | Right (Add Money + Button) */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
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
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-black font-extrabold text-xs px-4 py-2 rounded-full transition-all shadow-md shrink-0 mt-1 cursor-pointer"
            >
              Add Money +
            </button>
          </div>

          {/* Clean Subtle Separator Line */}
          <div className="w-full border-b border-white/10 my-5"></div>

          {/* Bottom half: Prominent Loyalty / Rewards Section */}
          <div className="bg-gradient-to-r from-[#14b8a6]/10 via-transparent to-transparent p-3.5 rounded-xl border border-[#14b8a6]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm mb-2.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="text-lg">🏅</span>
                <span>
                  Transit Rewards: <span className="text-[#2dd4bf]">3 of 5 rides</span> to your FREE trip!
                </span>
              </div>
              <span className="text-[11px] font-semibold text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">
                2 more rides to unlock free trip
              </span>
            </div>

            {/* Progress bar: 60% in teal */}
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner mb-2">
              <div
                className="bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] h-full rounded-full transition-all duration-500 shadow-sm relative"
                style={{ width: '60%' }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            <div className="text-[11px] font-medium text-white/60 flex items-center justify-between flex-wrap gap-1">
              <span>Keep riding to unlock by Aug 2026 🎉</span>
              <span className="text-[#2dd4bf] font-bold">60% Completed</span>
            </div>
          </div>
        </div>

        {/* 5. RECENT SEARCHES / FREQUENTLY TRAVELED ROUTES */}
        <div className="mb-8 w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', width: '100%', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <History size={14} className="text-[var(--color-accent-teal)]" />
              <span>Frequently Traveled Routes</span>
            </h3>
          </div>

          {uniqueUserRoutes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {uniqueUserRoutes.slice(0, 3).map((r, idx) => (
                <div
                  key={idx}
                  className="glass-card p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all flex items-center justify-between gap-4 bg-[var(--color-surface)]/90 shadow-md box-border"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-accent-teal)] shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm sm:text-base text-[var(--color-text)] truncate flex items-center gap-2">
                        <span>{r.from} → {r.to}</span>
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Last traveled: {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {r.duration}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}
                    className="btn btn-sm px-3.5 py-1.5 rounded-lg font-bold text-xs bg-[#14b8a6]/10 hover:bg-[#14b8a6] text-[#2dd4bf] hover:text-black transition-colors shrink-0 flex items-center gap-1 cursor-pointer border border-[#14b8a6]/30"
                  >
                    <span>Book Again</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 text-xs font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface)]/40 rounded-xl border border-[var(--glass-border)]">
              Your recent searches and frequently traveled routes will appear here
            </div>
          )}
        </div>

        {/* 6. RECENT BOOKINGS & PLAN YOUR FIRST TRIP PROMO CARD */}
        <div className="mb-8 w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', width: '100%', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <Ticket size={14} className="text-[var(--color-accent-teal)]" />
              <span>Recent Bookings</span>
            </h3>
            {userBookings.length > 0 && (
              <button onClick={() => navigate('/bookings')} className="text-xs font-bold text-[var(--color-accent-teal)] hover:underline flex items-center gap-1 cursor-pointer">
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
                  className="glass-card clickable p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all flex items-center justify-between gap-4 cursor-pointer bg-[var(--color-surface)]/90 shadow-md box-border"
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
            /* PLAN YOUR FIRST TRIP PROMOTIONAL CARD */
            <div
              className="rounded-2xl border border-[#14b8a6]/40 shadow-xl text-left relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.18) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden',
                padding: '20px 24px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#14b8a6]/20 border border-[#14b8a6]/40 flex items-center justify-center text-3xl shrink-0 shadow-md">
                  🗺️
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">Plan Your First Trip!</h4>
                  <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                    Comfortable rides, verified drivers, real-time GPS tracking across India
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center my-4" style={{ flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                <button
                  onClick={() => navigate('/search')}
                  style={{ padding: '8px 16px' }}
                  className="bg-[#14b8a6] hover:bg-[#0d9488] text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={14} />
                  <span>Search Transit</span>
                </button>
                <button
                  onClick={() => navigate('/packages')}
                  style={{ padding: '8px 16px' }}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Palmtree size={14} className="text-[#2dd4bf]" />
                  <span>View Packages</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center pt-3 border-t border-white/10 text-[11px] font-bold text-white/80" style={{ flexWrap: 'wrap', gap: '8px', margin: '0 4px', width: '100%' }}>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">✅ Group Booking</span>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">✅ Promo Codes</span>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">✅ Live Tracking</span>
              </div>
            </div>
          )}
        </div>

        {/* 7. JOURNEY STATS / INSIGHTS (Only show if user has at least 1 booking) */}
        {userBookings.length > 0 && (
          <div className="mb-8 w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', width: '100%', boxSizing: 'border-box' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <Award size={14} className="text-[var(--color-accent-teal)]" />
                <span>Your Journey Stats</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)]/80 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Car size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-[var(--color-text-tertiary)]">Total Trips</div>
                  <div className="text-lg font-black text-white">{userBookings.length}</div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)]/80 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-[var(--color-text-tertiary)]">Money Saved</div>
                  <div className="text-lg font-black text-emerald-400">₹{userBookings.length * 150}</div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)]/80 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Star size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-[var(--color-text-tertiary)]">Avg Rating</div>
                  <div className="text-lg font-black text-amber-300">4.9 ★</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. POPULAR ROUTES NEAR YOU (Real Data or pre-populated fallback) */}
        <div className="mb-8 w-full max-w-[800px] mx-auto" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', width: '100%', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
              <Map size={14} className="text-[var(--color-accent-teal)]" />
              <span>Popular Routes Near You</span>
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:overflow-x-auto pb-2 no-scrollbar w-full" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', gap: '16px' }}>
            {popularRoutes.map((route, i) => (
              <div
                key={i}
                onClick={() => navigate(`/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`)}
                style={{ minHeight: '140px', boxSizing: 'border-box' }}
                className="glass-card clickable p-4 rounded-2xl w-full sm:w-auto sm:min-w-[290px] shrink-0 border border-[var(--glass-border)] hover:border-[var(--color-accent-teal)] transition-all cursor-pointer flex flex-col justify-between group bg-[var(--color-surface)]/90 shadow-md"
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

                <div className="border-t border-[var(--glass-border)] pt-3 mt-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-tertiary)] font-medium flex items-center gap-1">
                      <Clock size={13} className="text-[var(--color-text-tertiary)]" />
                      {route.duration}
                    </span>
                    <span className="font-black text-base sm:text-lg text-[var(--color-accent-teal)]">{route.price}</span>
                  </div>
                  <button className="w-full btn btn-primary py-2 text-xs rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm">
                    <span>Book Now</span> <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
