import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, ArrowRightLeft, Wallet, Award,
  Clock, ArrowRight, Ticket, Star, Navigation, Gift, Repeat,
  ClipboardList, Route, Plus, Package, TrendingUp, Car, ChevronRight,
  Plane, TrainFront, LayoutGrid, Ship
} from 'lucide-react';
import { useAuthStore, useWalletStore, useBookingStore, useVehicleStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import DashboardHeader from '../components/DashboardHeader';
import UniversalSearchBar from '../components/UniversalSearchBar';
import LiveStatusCard from '../components/LiveStatusCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { balance, isLoading: walletLoading } = useWalletStore();
  const { bookings, isLoading: bookingsLoading } = useBookingStore();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const addToast = useToastStore(s => s.addToast);

  const [dbRoutes, setDbRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);

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
        const { data, error } = await supabase.from('routes').select('*').limit(25);
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

  // Fetch user search history
  useEffect(() => {
    async function fetchHistory() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', String(user.id))
          .order('searched_at', { ascending: false })
          .limit(15);
        if (!error && data) {
          setSearchHistory(data);
        }
      } catch (e) {
        console.warn('Error fetching search history:', e);
      }
    }
    fetchHistory();
  }, [user?.id]);

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
  // Group completed/confirmed bookings by route, ordered by frequency
  const routeFreqMap = new Map();
  (userBookings || [])
    .filter(b => b.pickup && b.destination)
    .forEach(b => {
      const key = `${b.pickup.trim()} -> ${b.destination.trim()}`;
      const existing = routeFreqMap.get(key) || { count: 0, from: b.pickup, to: b.destination, date: b.created_at || Date.now(), price: b.total_amount || b.price || 350, duration: b.duration || '25 min', isSearch: false };
      existing.count += 1;
      if (new Date(b.created_at || 0) > new Date(existing.date || 0)) {
        existing.date = b.created_at;
        existing.price = b.total_amount || b.price || existing.price;
      }
      routeFreqMap.set(key, existing);
    });

  const sortedBookingRoutes = Array.from(routeFreqMap.values()).sort((a, b) => b.count - a.count || new Date(b.date) - new Date(a.date));

  const uniqueUserRoutes = [];
  const seenRoutes = new Set();

  sortedBookingRoutes.forEach(r => {
    const key = `${r.from} -> ${r.to}`;
    if (!seenRoutes.has(key)) {
      seenRoutes.add(key);
      uniqueUserRoutes.push({
        from: r.from,
        to: r.to,
        date: r.date,
        price: typeof r.price === 'number' ? `₹${r.price}` : r.price.toString().startsWith('₹') ? r.price : `₹${r.price}`,
        duration: `${r.duration}`,
        isSearch: false
      });
    }
  });

  (searchHistory || []).forEach(s => {
    if (!s.from_location || !s.to_location) return;
    const key = `${s.from_location.trim()} -> ${s.to_location.trim()}`;
    if (!seenRoutes.has(key)) {
      seenRoutes.add(key);
      uniqueUserRoutes.push({
        from: s.from_location,
        to: s.to_location,
        date: s.searched_at || Date.now(),
        price: '₹350',
        duration: 'Est. 3h',
        isSearch: true
      });
    }
  });

  // Pre-populated Indian Popular Routes fallback with rich Mumbai routes
  const fallbackPopularRoutes = [
    { id: 'r1', from: 'Mumbai', to: 'Pune', duration: '3h 30m', price: 550 },
    { id: 'r7', from: 'Mumbai', to: 'Nashik', duration: '4h 15m', price: 480 },
    { id: 'r11', from: 'Mumbai', to: 'Surat', duration: '5h 00m', price: 600 },
    { id: 'r12', from: 'Mumbai', to: 'Shirdi', duration: '6h 00m', price: 700 },
    { id: 'r13', from: 'Mumbai', to: 'Lonavala', duration: '2h 00m', price: 350 },
    { id: 'r14', from: 'Mumbai', to: 'Mahabaleshwar', duration: '5h 30m', price: 650 },
    { id: 'r15', from: 'Mumbai', to: 'Aurangabad', duration: '7h 00m', price: 750 },
    { id: 'r16', from: 'Mumbai', to: 'Indore', duration: '11h 30m', price: 1100 },
    { id: 'r17', from: 'Mumbai', to: 'Bangalore', duration: '16h 00m', price: 1600 },
    { id: 'r18', from: 'Mumbai', to: 'Hyderabad', duration: '14h 00m', price: 1400 },
    { id: 'r8', from: 'Mumbai', to: 'Ahmedabad', duration: '9h 30m', price: 850 },
    { id: 'r4', from: 'Mumbai', to: 'Goa', duration: '10h 00m', price: 1200 },
  ];

  const fetchedRoutes = (dbRoutes && dbRoutes.length > 0)
    ? dbRoutes.map((r, i) => ({
        id: r.id || `db_${i}`,
        from: r.from_city || r.origin || r.source || r.pickup || 'Origin City',
        to: r.to_city || r.destination || r.dropoff || 'Destination City',
        price: r.base_price ? r.base_price : r.price ? r.price : r.fare ? r.fare : 350,
        duration: r.duration || r.est_duration || '3h 30m',
      }))
    : [];

  const seenRouteKeys = new Set(fetchedRoutes.map(r => `${r.from}->${r.to}`));
  const popularRoutes = [
    ...fetchedRoutes,
    ...fallbackPopularRoutes.filter(r => !seenRouteKeys.has(`${r.from}->${r.to}`))
  ];

  // Guest-safe stats: use explicit user guard so 0-booking guests never see stale fallbacks
  const tripCount  = user ? userBookings.length : 0;
  const distanceKm = user ? (tripCount * 125) : 0;
  const rewardsRs  = user ? (tripCount * 80)  : 0;

  const stats = [
    { icon: Ticket,    label: 'Total trips',       value: tripCount,              color: 'teal'   },
    { icon: Star,      label: 'Avg. rating',        value: user ? '4.8' : '—',    color: 'amber'  },
    { icon: Navigation,label: 'Distance covered',   value: `${distanceKm} km`,    color: 'blue'   },
    { icon: Gift,      label: 'Rewards earned',     value: `₹${rewardsRs}`,       color: 'purple' },
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
      <DashboardHeader subtitle="Your personal transit &amp; travel companion" />


      <div className="pax-content">
        {/* ── PROACTIVE LIVE STATUS (TripIt-Style) ── */}
        {currentTrip && (
          <div className="mb-6">
            <LiveStatusCard
              statusType={currentTrip.status === 'in_progress' ? 'driver_arriving' : 'booking_confirmed'}
              title={currentTrip.status === 'in_progress' ? 'Your ride is 4 min away' : 'Booking Confirmed'}
              description={`${currentTrip.vehicle_name || 'Vehicle'} • ${currentTrip.vehicle_number || ''} • Destination: ${currentTrip.destination || 'On route'}`}
              time="Updated just now"
              actionLabel="Live GPS Track"
              onAction={() => navigate('/tracking')}
              showPulse={true}
            />
          </div>
        )}

        {/* ── UNIVERSAL MULTI-TAB SEARCH BAR ── */}
        <div className="mb-6">
          <UniversalSearchBar />
        </div>

        {/* ── AIRBNB-STYLE CATEGORY RAIL ── */}
        <div className="mb-8">
          <div className="category-rail">
            {[
              { label: 'Cabs & Cars', icon: '🚗', path: '/vehicles' },
              { label: 'Homestays', icon: '🏠', path: '/host' },
              { label: 'Bus & Transit', icon: '🚌', path: '/search' },
              { label: 'Plan a Trip', icon: '🗺️', path: '/trip/new' },
              { label: 'Tour Packages', icon: '🌴', path: '/packages' },
              { label: 'Bike Rentals', icon: '🛵', path: '/rentals' },
              { label: 'Send Parcel', icon: '📦', path: '/parcel' },
              { label: 'Live Tracking', icon: '📍', path: '/tracking' },
            ].map((cat) => (
              <button
                key={cat.label}
                className="category-chip"
                onClick={() => navigate(cat.path)}
              >
                <span className="category-chip-icon">{cat.icon}</span>
                <span className="category-chip-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

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
              {uniqueUserRoutes.slice(0, 5).map((r, idx) => (
                <div key={idx} className="pax-booking-row" onClick={() => navigate(`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}>
                  <div>
                    <div className="pax-booking-route">{r.from} → {r.to}</div>
                    <div className="pax-booking-meta">{r.isSearch ? 'Recent search' : 'Last traveled'}: {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {r.duration}</div>
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
              <div className="flex gap-4 sm:gap-5 justify-center flex-wrap my-3">
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

