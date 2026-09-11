import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Ticket, Wallet, Car, Package, Users, ShieldCheck,
  LogOut, Menu, X, MapPin, UserCircle, Settings, Bell, ChevronRight,
  Briefcase, TruckIcon, ClipboardList, FileCheck, CreditCard, BarChart3,
  Home, Map, Bike, Palmtree, Navigation, User, Plane, TrainFront, Sun, Moon, Ship,
  Route as RouteIcon, Lock, LogIn, TrendingUp
} from 'lucide-react';

import { useAuthStore, useToastStore, useNotificationStore, usePlatformStore, useTransportModalStore, useThemeStore, useGuestLoginModalStore } from './store';
import { supabase } from './supabaseClient';
import ErrorBoundary from './components/ErrorBoundary';
import SkeletonLoader from './components/SkeletonLoader';
import OfflineBanner from './components/OfflineBanner';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import TransportModal from './components/TransportModal';
import BottomNav from './components/BottomNav';
import NotificationBell from './components/NotificationBell';
import GuestLoginModal from './components/GuestLoginModal';
import GuestSignInPrompt from './components/GuestSignInPrompt';

// ===== Lazy Loaded Pages (Priority 7 Code Splitting) =====
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SpendingAnalyticsPage = lazy(() => import('./pages/SpendingAnalyticsPage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage'));
const ParcelPage = lazy(() => import('./pages/ParcelPage'));
const AgentDashboardPage = lazy(() => import('./pages/AgentDashboardPage'));
const OwnerDashboardPage = lazy(() => import('./pages/OwnerDashboardPage'));
const DriverDashboardPage = lazy(() => import('./pages/DriverDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const DeviceSessionsPage = lazy(() => import('./pages/DeviceSessionsPage'));
const RentalPage = lazy(() => import('./pages/RentalPage'));
const DailyReportPage = lazy(() => import('./pages/DailyReportPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const PackageDetailsPage = lazy(() => import('./pages/PackageDetailsPage'));
const HostDashboardPage = lazy(() => import('./pages/HostDashboardPage'));
const SupportTicketsPage = lazy(() => import('./pages/SupportTicketsPage'));
const TripGraphPage = lazy(() => import('./pages/TripGraphPage'));
const FlightsPage = lazy(() => import('./pages/FlightsPage'));
const TrainsPage = lazy(() => import('./pages/TrainsPage'));
const FerriesPage = lazy(() => import('./pages/FerriesPage'));
import ChatWidget from './components/ChatWidget';

// ===== FIX 4: mapDbUser moved outside — no longer re-created on every render =====
const mapDbUser = (data) => ({
  id: data.id,
  email: data.email,
  name: data.name,
  phone: data.phone,
  role: data.role,
  emailVerified: data.email_verified,
  phoneVerified: data.phone_verified,
  bloodGroup: data.blood_group,
  dob: data.dob,
  age: data.age,
  gender: data.gender,
  address: data.address,
  aadharNumber: data.aadhar_number,
  panNumber: data.pan_number,
  avatarUrl: data.avatar_url,
  createdAt: data.created_at,
});

// ===== Toast Component =====
function ToastContainer() {
  const { toasts } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

// ===== ProtectedRoute — role-based access control (for staff/admin routes only) =====
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    const roleHome = {
      admin: '/admin', agent: '/agent', owner: '/owner',
      driver: '/driver', passenger: '/dashboard',
    };
    return <Navigate to={roleHome[user.role] || '/dashboard'} replace />;
  }

  return children;
}

// ===== GuestFriendlyRoute — personal-only pages: friendly prompt instead of redirect =====
function GuestFriendlyRoute({ children, label }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <GuestSignInPrompt label={label} />
      </AppLayout>
    );
  }
  return children;
}

// ===== Sidebar =====
function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openLogoutConfirm } = useAuthStore();

  const role = user?.role || 'passenger';

  const passengerLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/trip/new', label: 'Plan a Trip', icon: RouteIcon, badge: 'NEW' },
    { path: '/search', label: 'Search Trips', icon: Search },
    { path: '/bookings', label: 'My Bookings', icon: Ticket },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/packages', label: 'Holiday Packages', icon: Palmtree },
    { path: '/flights', label: 'Flights', icon: Plane },
    { path: '/trains', label: 'Trains', icon: TrainFront },
    { path: '/ferries', label: 'Ferries/Cruise Ships', icon: Ship },
    { path: '/host', label: 'My Homestay', icon: Home },
    { path: '/rentals', label: 'Rent Bike/Scooty', icon: Bike },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/parcel', label: 'Send Parcel', icon: Package },
    { path: '/tracking', label: 'Live Tracking', icon: Map },
    { path: '/support', label: 'Support Help Desk', icon: ClipboardList },
  ];

  const passengerGroups = [
    {
      title: 'TRAVEL',
      links: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/trip/new', label: 'Plan a Trip', icon: RouteIcon, badge: 'NEW' },
        { path: '/search', label: 'Search Trips', icon: Search },
        { path: '/bookings', label: 'My Bookings', icon: Ticket },
        { path: '/profile', label: 'My Profile', icon: UserCircle },
      ]
    },
    {
      title: 'TRANSIT & MORE',
      links: [
        { path: '/flights', label: 'Flights', icon: Plane },
        { path: '/trains', label: 'Trains', icon: TrainFront },
        { path: '/ferries', label: 'Ferries/Cruise Ships', icon: Ship },
        { path: '/rentals', label: 'Rent Bike/Scooty', icon: Bike },
        { path: '/vehicles', label: 'Vehicles', icon: Car },
      ]
    },
    {
      title: 'LIFESTYLE',
      links: [
        { path: '/packages', label: 'Holiday Packages', icon: Palmtree },
        { path: '/host', label: 'My Homestay', icon: Home },
        { path: '/parcel', label: 'Send Parcel', icon: Package },
        { path: '/tracking', label: 'Live Tracking', icon: Map },
      ]
    },
    {
      title: 'ACCOUNT',
      links: [
        { path: '/wallet', label: 'Wallet', icon: Wallet },
        { path: '/spending', label: 'Spending Analytics', icon: TrendingUp },
        { path: '/support', label: 'Support Help Desk', icon: ClipboardList },
        { path: '/sessions', label: 'Active Devices', icon: Settings },
      ]
    }
  ];

  const agentLinks = [
    { path: '/agent', label: 'Agent Dashboard', icon: LayoutDashboard },
    { path: '/trip/new', label: 'Plan Client Trip', icon: RouteIcon, badge: 'NEW' },
    { path: '/search', label: 'Book for Customer', icon: Search },
    { path: '/packages', label: 'Holiday Packages', icon: Palmtree },
    { path: '/flights', label: 'Flights', icon: Plane },
    { path: '/trains', label: 'Trains', icon: TrainFront },
    { path: '/ferries', label: 'Ferries/Cruise Ships', icon: Ship },
    { path: '/host', label: 'Homestay Booking', icon: Home },
    { path: '/rentals', label: 'Rent Bike/Scooty', icon: Bike },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/bookings', label: 'All Bookings', icon: Ticket },
    { path: '/daily-report', label: 'Daily Report', icon: ClipboardList },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/spending', label: 'Spending Analytics', icon: TrendingUp },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/support', label: 'Support', icon: ClipboardList },
  ];

  const ownerLinks = [
    { path: '/owner', label: 'Owner Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/vehicles', label: 'My Vehicles', icon: Car },
    { path: '/bookings', label: 'Bookings', icon: Ticket },
    { path: '/daily-report', label: 'Daily Report', icon: ClipboardList },
    { path: '/wallet', label: 'Earnings', icon: Wallet },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Admin Panel', icon: ShieldCheck },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/bookings', label: 'Bookings', icon: Ticket },
    { path: '/wallet', label: 'Wallets', icon: Wallet },
  ];

  const driverLinks = [
    { path: '/driver', label: 'Driver Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/bookings', label: 'Assigned Trips', icon: MapPin },
    { path: '/wallet', label: 'Earnings', icon: Wallet },
  ];

  const links =
    role === 'agent' ? agentLinks
    : role === 'owner' ? ownerLinks
    : role === 'admin' ? adminLinks
    : role === 'driver' ? driverLinks
    : passengerLinks;

  // For guests: lock-icon personal links open modal instead of navigating
  const GUEST_LOCKED_PATHS = ['/wallet', '/spending', '/bookings', '/profile', '/sessions', '/support'];

  const handleNav = (path) => {
    if (!user && GUEST_LOCKED_PATHS.includes(path)) {
      useGuestLoginModalStore.getState().openModal('signin');
      onClose();
      return;
    }
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    openLogoutConfirm();
    onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="YatraGo" className="sidebar-logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', objectFit: 'contain' }} />
            <span className="sidebar-logo-text">YatraGo</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="sidebar-nav">
          {role === 'passenger' ? (
            passengerGroups.map((group) => (
              <div key={group.title}>
                <div
                  className="sidebar-section-title"
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: '16px',
                    marginBottom: '8px',
                    fontWeight: 600,
                    padding: '0 4px'
                  }}
                >
                  {group.title}
                </div>
                {group.links.map((link) => {
                  const isLocked = !user && GUEST_LOCKED_PATHS.includes(link.path);
                  return (
                    <button
                      key={link.path || link.label}
                      className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
                      onClick={() => {
                        if (link.isModal) {
                          useTransportModalStore.getState().openModal(link.isModal);
                          onClose();
                        } else {
                          handleNav(link.path);
                        }
                      }}
                      title={isLocked ? 'Sign in to access' : ''}
                    >
                      <link.icon className="sidebar-link-icon" size={20} />
                      {link.label}
                      {link.badge && <span className="sidebar-link-badge">{link.badge}</span>}
                      {isLocked && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <>
              <div className="sidebar-section-title">
                {role === 'agent' ? 'Agent Portal'
                  : role === 'owner' ? 'Owner Portal'
                  : role === 'admin' ? 'Admin Panel'
                  : role === 'driver' ? 'Driver Portal'
                  : 'Navigation'}
              </div>
              {links.map(link => (
                <button
                  key={link.path || link.label}
                  className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => {
                    if (link.isModal) {
                      useTransportModalStore.getState().openModal(link.isModal);
                      onClose();
                    } else {
                      handleNav(link.path);
                    }
                  }}
                >
                  <link.icon className="sidebar-link-icon" size={20} />
                  {link.label}
                  {link.badge && <span className="sidebar-link-badge">{link.badge}</span>}
                </button>
              ))}

              <div className="sidebar-section-title">Account</div>
              <button
                className={`sidebar-link ${location.pathname === '/sessions' ? 'active' : ''}`}
                onClick={() => handleNav('/sessions')}
              >
                <Settings className="sidebar-link-icon" size={20} />
                Active Devices
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-user">
          {user ? (
            <>
              <div
                className="sidebar-avatar"
                style={{
                  backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  color: user.avatarUrl ? 'transparent' : 'white',
                }}
              >
                {!user.avatarUrl && (user.name?.[0]?.toUpperCase() || 'U')}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name || 'User'}</div>
                <div className="sidebar-user-role">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            /* Guest — Sign In button in sidebar bottom block */
            <button
              id="sidebar-guest-signin"
              className="btn btn-primary btn-full"
              style={{ flex: 1, gap: 8, justifyContent: 'center' }}
              onClick={() => {
                useGuestLoginModalStore.getState().openModal('signin');
                onClose();
              }}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  );
}


// ===== Theme Toggle =====
function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';
  
  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-ghost btn-icon" 
      style={{ color: 'var(--color-text-secondary)' }}
      title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
    >
      {isLight ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}

// ===== App Layout =====
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const closeModal = useTransportModalStore(s => s.closeModal);
  const { theme } = useThemeStore();

  useEffect(() => {
    closeModal();
  }, [location.pathname, closeModal]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="sidebar-logo-text" style={{ fontSize: '1.15rem', cursor: 'pointer' }} onClick={() => navigate('/')}>YatraGo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'space-between' }}>
        <div className="app-content" style={{ flex: '1 0 auto', width: '100%' }}>
          <ErrorBoundary key={window.location.hash}>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      <LogoutConfirmModal />
      <TransportModal />
      <GuestLoginModal />
      <ErrorBoundary title="Yaara chat unavailable" message="Yaara encountered an issue. Tap to reload.">
        <ChatWidget />
      </ErrorBoundary>
    </div>
  );
}

// ===== Main App =====
export default function App() {
  const { user, isAuthenticated } = useAuthStore();
  const fetchSettings = usePlatformStore(s => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        try {
          const { user: authUser } = session;

          const { data: emailUsers } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email);
          
          let existingUser = Array.isArray(emailUsers) && emailUsers.length > 0 ? emailUsers[0] : (emailUsers || null);

          if (!existingUser && authUser.id) {
            const res = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id);
            existingUser = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : (res.data || null);
          }

          if (existingUser && existingUser.role) {
            useAuthStore.setState({ user: mapDbUser(existingUser), isAuthenticated: true });
          } else {
            // FIX 2: User exists in auth.users but NOT in public.users (or has no role).
            // Do not insert blindly or let them get stuck without a role.
            // Redirect to role selection/registration page!
            useAuthStore.setState({ isAuthenticated: false, user: null });
            
            const intendedRole =
              authUser.user_metadata?.intended_role ||
              localStorage.getItem('oauth_intended_role') || '';
            localStorage.removeItem('oauth_intended_role');

            const params = new URLSearchParams();
            if (intendedRole) params.set('role', intendedRole);
            if (authUser.email) params.set('email', authUser.email);
            if (authUser.user_metadata?.full_name) params.set('name', authUser.user_metadata.full_name);

            window.location.hash = `#/register?${params.toString()}`;
            useToastStore.getState().addToast('Please complete your role selection and registration.', 'info');
          }
        } catch (err) {
          console.error('Error syncing Google Auth with public.users', err);
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, isAuthenticated: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <HashRouter>
      <OfflineBanner />
      <ToastContainer />
      <Suspense fallback={
        <div style={{ minHeight: '100vh', padding: '24px', background: 'var(--bg-main, #0f172a)' }}>
          <SkeletonLoader type="page" />
        </div>
      }>
        <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/admin/login" element={<ErrorBoundary><AdminLoginPage /></ErrorBoundary>} />
        <Route path="/register" element={<ErrorBoundary><RegisterPage /></ErrorBoundary>} />
        <Route path="/verify" element={<ErrorBoundary><VerificationPage /></ErrorBoundary>} />

        {/* ── Personal-only pages: friendly prompt for guests, no silent redirect ── */}
        <Route path="/profile"  element={<GuestFriendlyRoute label="Profile"><AppLayout><ProfilePage /></AppLayout></GuestFriendlyRoute>} />
        <Route path="/sessions" element={<GuestFriendlyRoute label="Devices"><AppLayout><DeviceSessionsPage /></AppLayout></GuestFriendlyRoute>} />
        <Route path="/bookings" element={<GuestFriendlyRoute label="Bookings"><AppLayout><MyBookingsPage /></AppLayout></GuestFriendlyRoute>} />
        <Route path="/wallet"   element={<GuestFriendlyRoute label="Wallet"><AppLayout><WalletPage /></AppLayout></GuestFriendlyRoute>} />
        <Route path="/spending" element={<GuestFriendlyRoute label="Spending Analytics"><AppLayout><SpendingAnalyticsPage /></AppLayout></GuestFriendlyRoute>} />
        <Route path="/support"  element={<GuestFriendlyRoute label="Support"><AppLayout><SupportTicketsPage /></AppLayout></GuestFriendlyRoute>} />

        {/* ── Staff/role-gated pages — keep ProtectedRoute ── */}
        <Route path="/admin"  element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminDashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><AppLayout><DriverDashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/daily-report" element={<ProtectedRoute><AppLayout><DailyReportPage /></AppLayout></ProtectedRoute>} />

        {/* ── PUBLIC listing + browsing routes — no auth needed ── */}
        <Route path="/dashboard"        element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/search"           element={<AppLayout><SearchPage /></AppLayout>} />
        <Route path="/book/:routeId"    element={<AppLayout><BookingPage /></AppLayout>} />
        <Route path="/booking"          element={<AppLayout><BookingPage /></AppLayout>} />
        <Route path="/booking/:routeId" element={<AppLayout><BookingPage /></AppLayout>} />
        <Route path="/flights"          element={<AppLayout><FlightsPage /></AppLayout>} />
        <Route path="/trains"           element={<AppLayout><TrainsPage /></AppLayout>} />
        <Route path="/ferries"          element={<AppLayout><FerriesPage /></AppLayout>} />
        <Route path="/packages"         element={<AppLayout><PackagesPage /></AppLayout>} />
        <Route path="/package/:packageId" element={<AppLayout><PackageDetailsPage /></AppLayout>} />
        <Route path="/vehicles"         element={<AppLayout><VehiclesPage /></AppLayout>} />
        <Route path="/vehicle/:vehicleId" element={<AppLayout><VehicleDetailPage /></AppLayout>} />
        <Route path="/rentals"          element={<AppLayout><RentalPage /></AppLayout>} />
        <Route path="/host"             element={<AppLayout><HostDashboardPage /></AppLayout>} />
        <Route path="/parcel"           element={<AppLayout><ParcelPage /></AppLayout>} />
        <Route path="/tracking"         element={<AppLayout><LiveTrackingPage /></AppLayout>} />

        {/* Agent-only Routes */}
        <Route path="/agent" element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AppLayout><AgentDashboardPage /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Owner-only Routes */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <AppLayout><OwnerDashboardPage /></AppLayout>
          </ProtectedRoute>
        } />


        {/* Trip Graph Routes — public browse; save action gated inside TripGraphPage */}
        <Route path="/trip/new"      element={<AppLayout><TripGraphPage /></AppLayout>} />
        <Route path="/trip/:tripId"  element={<AppLayout><TripGraphPage /></AppLayout>} />

        {/* Default: guests land on dashboard, not login page */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
