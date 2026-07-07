import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, ArrowRightLeft, Wallet, Award,
  Clock, ArrowRight, Ticket, Star, Navigation, Gift, Repeat,
  ClipboardList, Route, Plus, Package, TrendingUp, Car, ChevronRight
} from 'lucide-react';
import { useAuthStore, useWalletStore, useBookingStore, useVehicleStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import NotificationBell from '../components/NotificationBell';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { balance, isLoading: walletLoading } = useWalletStore();
  const { bookings, isLoading: bookingsLoading } = useBookingStore();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const addToast = useToastStore(s => s.addToast);

  const [dbRoutes, setDbRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  // Quick search widget state
  const [quickFrom, setQuickFrom] = useState('Mumbai');
  const [quickTo, setQuickTo] = useState('Pune');
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);

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

  const swapCities = () => {
    const temp = quickFrom;
    setQuickFrom(quickTo);
    setQuickTo(temp);
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
  const recentBookings = userBookings.slice(0, 3);

  // Time greeting
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format unique user routes for Frequently Travelled Routes section
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
    { id: 'r1', type: 'Intercity express', from: 'Mumbai', to: 'Pune', duration: '3h 30m', price: 550, badge: 'Popular' },
    { id: 'r7', type: 'Highway shuttle', from: 'Mumbai', to: 'Nashik', duration: '4h 15m', price: 480, badge: 'Popular' },
    { id: 'r8', type: 'Overnight express', from: 'Mumbai', to: 'Ahmedabad', duration: '9h 30m', price: 850, badge: 'Top rated' },
    { id: 'r4', type: 'Coastal route', from: 'Mumbai', to: 'Goa', duration: '10h 0m', price: 1200, badge: 'Scenic' },
  ];

  const popularRoutes = (dbRoutes && dbRoutes.length > 0)
    ? dbRoutes.map((r, i) => ({
        id: r.id || `db_${i}`,
        from: r.from_city || r.origin || r.source || r.pickup || 'Origin City',
        to: r.to_city || r.destination || r.dropoff || 'Destination City',
        price: r.base_price ? r.base_price : r.price ? r.price : r.fare ? r.fare : 350,
        duration: r.duration || r.est_duration || '3h',
        type: r.vehicle_type || r.type || 'Intercity Express',
        badge: i === 0 ? 'Popular' : i === 1 ? 'Top rated' : 'Scenic'
      }))
    : fallbackPopularRoutes;

  const stats = [
    { icon: Ticket, label: 'Total trips', value: userBookings.length || 0, color: 'teal' },
    { icon: Star, label: 'Avg. rating', value: '4.8', color: 'amber' },
    { icon: Navigation, label: 'Distance covered', value: `${(userBookings.length * 125) || 1240} km`, color: 'blue' },
    { icon: Gift, label: 'Rewards earned', value: `₹${(userBookings.length * 80) || 320}`, color: 'purple' },
  ];

  if (isLoading && userBookings.length === 0) {
    return (
      <div className="pax-dashboard">
        <div className="pax-content">
          <SkeletonLoader type="card" count={1} />
          <div className="my-6">
            <SkeletonLoader type="stat" count={3} />
          </div>
          <SkeletonLoader type="list" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="pax-dashboard animate-fade-in">
      {/* TOP BAR */}
      <div className="pax-topbar">
        <div>
          <h1 className="pax-greeting">
            <span>{greeting()}, {displayGreetingName}</span>
            <span>👋</span>
          </h1>
          <p className="pax-sub-greeting">Your personal transit & travel companion</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell
            buttonClassName="rounded-full bg-[var(--color-surface)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--color-text)] hover:border-[var(--color-accent-teal)] transition-all relative shadow-sm cursor-pointer shrink-0"
            buttonStyle={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            iconSize={18}
          />
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

      <div className="pax-content">
        {/* ── HERO SEARCH ── */}
        <div className="pax-search-card">
          <div className="pax-search-header">
            <span className="pax-search-title">Search transit</span>
            <span className="pax-search-sub">Bus · Train · Shared cab</span>
          </div>
          <form onSubmit={handleQuickSearch}>
            <div className="pax-search-row">
              <div className="pax-search-field">
                <label className="pax-field-label">From</label>
                <div className="pax-field-input">
                  <MapPin size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
                  <input
                    className="pax-field-input-text"
                    value={quickFrom}
                    onChange={e => setQuickFrom(e.target.value)}
                    placeholder="e.g. Mumbai"
                  />
                </div>
              </div>

              <button
                type="button"
                className="pax-swap-btn"
                onClick={swapCities}
                title="Swap cities"
              >
                <ArrowRightLeft size={16} />
              </button>

              <div className="pax-search-field">
                <label className="pax-field-label">To</label>
                <div className="pax-field-input">
                  <Navigation size={16} className="text-[#3b82f6] shrink-0" />
                  <input
                    className="pax-field-input-text"
                    value={quickTo}
                    onChange={e => setQuickTo(e.target.value)}
                    placeholder="e.g. Pune"
                  />
                </div>
              </div>

              <div className="pax-search-field">
                <label className="pax-field-label">Date</label>
                <div className="pax-field-input">
                  <Calendar size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
                  <input
                    type="date"
                    className="pax-field-input-text font-medium cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    value={quickDate}
                    onChange={e => setQuickDate(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="pax-search-btn">
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── LIVE TRIP BANNER (If Active Ride Exists) ── */}
        {currentTrip && (
          <div
            onClick={() => navigate('/tracking')}
            className="mb-8 p-4 border border-[var(--color-accent-teal)] bg-gradient-to-r from-[var(--color-accent-teal)]/20 via-[var(--color-surface)] to-[var(--color-surface)] relative overflow-hidden shadow-lg cursor-pointer group rounded-2xl transition-all hover:border-[var(--color-accent-teal-light)] flex items-center justify-between gap-4"
          >
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
        )}

        {/* ── WALLET + STATS ── */}
        <div className="pax-two-col">
          {/* Wallet */}
          <div className="pax-wallet-card">
            <div className="pax-wallet-top">
              <div>
                <div className="pax-wallet-label">YatraGo Pay balance</div>
                <div className="pax-wallet-balance">₹{balance?.toLocaleString('en-IN') || '0'}</div>
                <div className="pax-wallet-sub">Available to spend</div>
              </div>
              <button className="pax-add-money-btn" onClick={() => navigate('/wallet')}>
                <Plus size={15} />
                <span>Add money</span>
              </button>
            </div>
            <div className="pax-wallet-divider" />
            <div className="pax-wallet-rewards">
              <div className="pax-rewards-header">
                <div className="pax-rewards-title">
                  <Award size={16} color="#f59e0b" />
                  <span>Transit rewards</span>
                </div>
                <div className="pax-rewards-count">3 of 5 rides</div>
              </div>
              <div className="pax-progress-bar">
                <div className="pax-progress-fill" />
              </div>
              <div className="pax-rewards-footer">
                <span>2 more rides to your free trip</span>
                <span className="pax-rewards-expire">
                  <Clock size={12} />
                  <span>Expires Aug 2026</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pax-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="pax-stat-card">
                <div className={`pax-stat-icon ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <div>
                  <div className="pax-stat-val">{s.value}</div>
                  <div className="pax-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FREQUENTLY TRAVELLED ── */}
        <Section
          icon={<Repeat size={15} className="text-[var(--color-text-tertiary)]" />}
          title="Frequently travelled routes"
        >
          {uniqueUserRoutes.length === 0 ? (
            <div className="pax-empty-state">
              <div className="pax-empty-icon"><Route size={22} className="text-[var(--color-text-tertiary)]" /></div>
              <div className="pax-empty-title">No routes yet</div>
              <p className="pax-empty-body">Your frequent routes will appear here once you start travelling.</p>
              <button className="pax-empty-cta" onClick={() => navigate('/search')}>
                <Search size={14} />
                <span>Search a trip</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {uniqueUserRoutes.slice(0, 3).map((r, idx) => (
                <div key={idx} className="pax-booking-row" onClick={() => navigate(`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}>
                  <div>
                    <div className="pax-booking-route">{r.from} → {r.to}</div>
                    <div className="pax-booking-meta">Last traveled: {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {r.duration}</div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm font-bold text-[var(--color-accent-teal)]">{r.price}</span>
                    <button className="text-xs font-semibold px-3 py-1 rounded bg-[var(--color-accent-teal)]/10 text-[var(--color-accent-teal)] hover:bg-[var(--color-accent-teal)] hover:text-white transition-all">
                      Book again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── RECENT BOOKINGS ── */}
        <Section
          icon={<ClipboardList size={15} className="text-[var(--color-text-tertiary)]" />}
          title="Recent bookings"
          action={recentBookings.length > 0 ? { label: 'View all', onClick: () => navigate('/bookings') } : null}
        >
          {recentBookings.length === 0 ? (
            <div className="pax-empty-state">
              <div className="pax-empty-icon"><Ticket size={22} className="text-[var(--color-text-tertiary)]" /></div>
              <div className="pax-empty-title">Plan your first trip</div>
              <p className="pax-empty-body">Comfortable rides, verified drivers, real-time GPS tracking across India.</p>
              <div className="flex gap-2.5 justify-center flex-wrap">
                <button className="pax-empty-cta" onClick={() => navigate('/search')}>
                  <Search size={14} />
                  <span>Search transit</span>
                </button>
                <button className="pax-empty-cta" onClick={() => navigate('/packages')}>
                  <Package size={14} />
                  <span>View packages</span>
                </button>
              </div>
              <div className="pax-feature-tags">
                {['Group booking', 'Promo codes', 'Live tracking'].map(tag => (
                  <span key={tag} className="pax-feature-tag">{tag}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentBookings.map(b => (
                <div key={b.id || Math.random()} className="pax-booking-row" onClick={() => navigate('/bookings')}>
                  <div>
                    <div className="pax-booking-route">{b.pickup || b.route?.from || 'Origin'} → {b.destination || b.route?.to || 'Destination'}</div>
                    <div className="pax-booking-meta">{new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {b.vehicle_name || b.trip_type || 'Ride'}</div>
                  </div>
                  <div className="text-right">
                    <div className="pax-booking-amount">₹{b.total_amount || b.price || '350'}</div>
                    <div className={`pax-booking-status ${['confirmed', 'completed'].includes(b.status) ? 'text-[var(--color-accent-teal)]' : 'text-[var(--color-text-tertiary)]'}`}>
                      {b.status || 'completed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── POPULAR ROUTES ── */}
        <Section
          icon={<TrendingUp size={15} className="text-[var(--color-text-tertiary)]" />}
          title="Popular routes near you"
          action={{ label: 'View all', onClick: () => navigate('/search') }}
        >
          <div className="pax-routes-grid">
            {popularRoutes.map((route, idx) => (
              <div key={route.id || idx} className="pax-route-card">
                <div className="pax-route-meta">
                  <span className="pax-route-type">{route.type}</span>
                  <span className="pax-route-badge">{route.badge || 'Popular'}</span>
                </div>
                <div className="pax-route-cities">
                  <span className="pax-city-name">{route.from}</span>
                  <div className="pax-route-arrow">
                    <div className="pax-arrow-line" />
                    <div className="pax-arrow-dot" />
                    <div className="pax-arrow-line" />
                  </div>
                  <span className="pax-city-name">{route.to}</span>
                </div>
                <div className="pax-route-info">
                  <span className="pax-route-time"><Clock size={13} /> {route.duration}</span>
                  <span className="pax-route-price">₹{route.price}</span>
                </div>
                <button
                  className="pax-book-btn"
                  onClick={() => navigate(`/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`)}
                >
                  <span>Book now</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ── Section wrapper component ── */
function Section({ icon, title, action, children }) {
  return (
    <div className="pax-section">
      <div className="pax-section-header">
        <div className="pax-section-title">{icon}<span>{title}</span></div>
        {action && (
          <button className="pax-section-link" onClick={action.onClick}>
            <span>{action.label}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div className="pax-section-body">{children}</div>
    </div>
  );
}
