import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Ticket, Wallet, Car, Package, Users, ShieldCheck,
  LogOut, Menu, X, MapPin, UserCircle, Settings, Bell, ChevronRight,
  Briefcase, TruckIcon, ClipboardList, FileCheck, CreditCard, BarChart3,
  Home, Map, Bike, Palmtree, Navigation, User, Plane, TrainFront
} from 'lucide-react';
import { useAuthStore, useToastStore, useNotificationStore, usePlatformStore, useTransportModalStore } from './store';
import { supabase } from './supabaseClient';
import ErrorBoundary from './components/ErrorBoundary';
import SkeletonLoader from './components/SkeletonLoader';
import OfflineBanner from './components/OfflineBanner';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import TransportModal from './components/TransportModal';

// ===== Lazy Loaded Pages (Priority 7 Code Splitting) =====
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
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

// ===== FIX 1: ProtectedRoute with role-based access control =====
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based guard — redirect unauthorized users to their own dashboard
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    const roleHome = {
      admin: '/admin',
      agent: '/agent',
      owner: '/owner',
      driver: '/driver',
      passenger: '/dashboard',
    };
    return <Navigate to={roleHome[user.role] || '/dashboard'} replace />;
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
    { path: '/search', label: 'Search Trips', icon: Search },
    { path: '/bookings', label: 'My Bookings', icon: Ticket },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/packages', label: 'Holiday Packages', icon: Palmtree },
    { path: '#flights', label: 'Flights', icon: Plane, isModal: 'flights' },
    { path: '#trains', label: 'Trains', icon: TrainFront, isModal: 'trains' },
    { path: '/host', label: 'My Homestay', icon: Home },
    { path: '/rentals', label: 'Rent Bike/Scooty', icon: Bike },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/parcel', label: 'Send Parcel', icon: Package },
    { path: '/tracking', label: 'Live Tracking', icon: Map },
    { path: '/support', label: 'Support Help Desk', icon: ClipboardList },
  ];

  const agentLinks = [
    { path: '/agent', label: 'Agent Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/search', label: 'Book for Customer', icon: Search },
    { path: '/bookings', label: 'All Bookings', icon: Ticket },
    { path: '/daily-report', label: 'Daily Report', icon: ClipboardList },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/support', label: 'Support Help Desk', icon: ClipboardList },
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

  const handleNav = (path) => {
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
        <div className="sidebar-logo">
          <img src="/logo.png" alt="YatraGo" className="sidebar-logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', objectFit: 'contain' }} />
          <span className="sidebar-logo-text">YatraGo</span>
        </div>

        <nav className="sidebar-nav">
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
        </nav>

        <div className="sidebar-user">
          <div
            className="sidebar-avatar"
            style={{
              backgroundImage: user?.avatarUrl ? `url(${user.avatarUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: user?.avatarUrl ? 'transparent' : 'white',
            }}
          >
            {!user?.avatarUrl && (user?.name?.[0]?.toUpperCase() || 'U')}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

// ===== Bottom Nav =====
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || 'passenger';

  const items =
    role === 'passenger' ? [
      { path: '/dashboard', label: 'Home', icon: Home },
      { path: '/bookings', label: 'Trips', icon: Ticket },
      { path: '/tracking', label: 'Track', icon: Navigation },
      { path: '/parcel', label: 'Parcel', icon: Package },
      { path: '/profile', label: 'Profile', icon: User },
    ]
    : role === 'agent' ? [
      { path: '/agent', label: 'Dashboard', icon: Home },
      { path: '/search', label: 'Book', icon: Search },
      { path: '/bookings', label: 'Bookings', icon: Ticket },
      { path: '/wallet', label: 'Wallet', icon: Wallet },
    ]
    : role === 'owner' ? [
      { path: '/owner', label: 'Dashboard', icon: Home },
      { path: '/vehicles', label: 'Vehicles', icon: Car },
      { path: '/bookings', label: 'Bookings', icon: Ticket },
      { path: '/wallet', label: 'Earnings', icon: Wallet },
    ]
    : role === 'driver' ? [
      { path: '/driver', label: 'Dashboard', icon: Home },
      { path: '/bookings', label: 'Trips', icon: MapPin },
      { path: '/wallet', label: 'Earnings', icon: Wallet },
    ]
    : [
      { path: '/admin', label: 'Panel', icon: ShieldCheck },
      { path: '/vehicles', label: 'Vehicles', icon: Car },
      { path: '/bookings', label: 'Bookings', icon: Ticket },
      { path: '/wallet', label: 'Wallets', icon: Wallet },
    ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.path}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ===== FIX 2: Notification Bell with click-outside close =====
function NotificationBell() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const bellRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when user clicks outside the bell area
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.reference_type === 'vehicle_approved') {
      navigate('/vehicles');
    }
  };

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setIsOpen(prev => !prev)}
        style={{ position: 'relative' }}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--color-accent-red)', color: 'white',
            fontSize: '10px', fontWeight: 'bold',
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
          border: 'var(--border-subtle)', zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: 'var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                No new notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px', borderBottom: 'var(--border-subtle)',
                    background: notif.is_read ? 'transparent' : 'rgba(27, 153, 139, 0.05)',
                    cursor: 'pointer', display: 'flex', gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--color-accent-teal)', marginTop: 6,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== App Layout =====
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="sidebar-logo-text" style={{ fontSize: '1.1rem' }}>YatraGo</span>
        <NotificationBell />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main">
        <div className="app-content">
          <ErrorBoundary key={window.location.hash}>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      <BottomNav />
      <LogoutConfirmModal />
      <TransportModal />
      <ErrorBoundary title="Chat assistant unavailable" message="The AI Assistant encountered an issue. Tap to reload.">
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

        {/* Shared Authenticated Routes (all roles) */}
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><AppLayout><DeviceSessionsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><AppLayout><MyBookingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><AppLayout><WalletPage /></AppLayout></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><AppLayout><VehiclesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/vehicle/:vehicleId" element={<ProtectedRoute><AppLayout><VehicleDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/daily-report" element={<ProtectedRoute><AppLayout><DailyReportPage /></AppLayout></ProtectedRoute>} />
        <Route path="/packages" element={<ProtectedRoute><AppLayout><PackagesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/package/:packageId" element={<ProtectedRoute><AppLayout><PackageDetailsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/host" element={<ProtectedRoute><AppLayout><HostDashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><AppLayout><SupportTicketsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminDashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><AppLayout><DriverDashboardPage /></AppLayout></ProtectedRoute>} />

        {/* Passenger-only Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['passenger']}>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute allowedRoles={['passenger', 'agent']}>
            <AppLayout><SearchPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/book/:routeId" element={
          <ProtectedRoute allowedRoles={['passenger', 'agent']}>
            <AppLayout><BookingPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/tracking" element={
          <ProtectedRoute allowedRoles={['passenger']}>
            <AppLayout><LiveTrackingPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/parcel" element={
          <ProtectedRoute allowedRoles={['passenger']}>
            <AppLayout><ParcelPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/rentals" element={
          <ProtectedRoute allowedRoles={['passenger']}>
            <AppLayout><RentalPage /></AppLayout>
          </ProtectedRoute>
        } />

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

        {/* Admin-only Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><AdminDashboardPage /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
