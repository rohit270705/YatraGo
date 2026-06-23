import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Search, Ticket, Wallet, Car, Package, Users, ShieldCheck,
  LogOut, Menu, X, MapPin, UserCircle, Settings, Bell, ChevronRight,
  Briefcase, TruckIcon, ClipboardList, FileCheck, CreditCard, BarChart3,
  Home, Map, Bike
} from 'lucide-react';
import { useAuthStore, useToastStore, useNotificationStore } from './store';
import { supabase } from './supabaseClient';

// ===== Pages =====
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import WalletPage from './pages/WalletPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import ParcelPage from './pages/ParcelPage';
import AgentDashboardPage from './pages/AgentDashboardPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DeviceSessionsPage from './pages/DeviceSessionsPage';
import RentalPage from './pages/RentalPage';
import DailyReportPage from './pages/DailyReportPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import ChatWidget from './components/ChatWidget';

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

// ===== Protected Route =====
function ProtectedRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isProfileIncomplete = user && (!user.phone || !user.dob || !user.bloodGroup);

  if (isProfileIncomplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace state={{ fromIncomplete: true, message: "Please complete your profile details first." }} />;
  }

  return children;
}

// ===== Sidebar =====
function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const role = user?.role || 'passenger';

  const passengerLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/search', label: 'Search Trips', icon: Search },
    { path: '/bookings', label: 'My Bookings', icon: Ticket },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/rentals', label: 'Rent Bike/Scooty', icon: Bike },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/parcel', label: 'Send Parcel', icon: Package },
    { path: '/tracking', label: 'Live Tracking', icon: Map },
  ];

  const agentLinks = [
    { path: '/agent', label: 'Agent Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/search', label: 'Book for Customer', icon: Search },
    { path: '/bookings', label: 'All Bookings', icon: Ticket },
    { path: '/daily-report', label: 'Daily Report', icon: ClipboardList },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
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

  const links = role === 'agent' ? agentLinks
    : role === 'owner' ? ownerLinks
    : role === 'admin' ? adminLinks
    : passengerLinks;

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✈</div>
          <span className="sidebar-logo-text">YatraGo</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">
            {role === 'agent' ? 'Agent Portal' : role === 'owner' ? 'Owner Portal' : role === 'admin' ? 'Admin Panel' : 'Navigation'}
          </div>
          {links.map(link => (
            <button
              key={link.path}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => handleNav(link.path)}
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
          <div className="sidebar-avatar" style={{ 
            backgroundImage: user?.avatarUrl ? `url(${user.avatarUrl})` : 'none', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            color: user?.avatarUrl ? 'transparent' : 'white' 
          }}>
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

  const items = role === 'passenger' ? [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/rentals', label: 'Rentals', icon: Bike },
    { path: '/bookings', label: 'Bookings', icon: Ticket },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
  ] : role === 'agent' ? [
    { path: '/agent', label: 'Dashboard', icon: Home },
    { path: '/search', label: 'Book', icon: Search },
    { path: '/bookings', label: 'Bookings', icon: Ticket },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
  ] : role === 'owner' ? [
    { path: '/owner', label: 'Dashboard', icon: Home },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/bookings', label: 'Bookings', icon: Ticket },
    { path: '/wallet', label: 'Earnings', icon: Wallet },
  ] : [
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

// ===== Notification Bell =====
function NotificationBell() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.reference_type === 'vehicle_approved') {
      navigate('/vehicles'); // Or specific dashboard based on role
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-ghost btn-icon" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--color-accent-red)', color: 'white',
            fontSize: '10px', fontWeight: 'bold',
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
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
          border: 'var(--border-subtle)', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: 'var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
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
                    cursor: 'pointer', display: 'flex', gap: 12
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
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent-teal)', marginTop: 6 }} />
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
        <div style={{ position: 'relative' }}>
          <NotificationBell />
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main">
        <div className="app-content">
          {children}
        </div>
      </main>

      <BottomNav />
      <ChatWidget />
    </div>
  );
}

// ===== Main App =====
export default function App() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Helper to map DB snake_case to UI camelCase
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

    // Listen for Google Auth changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // When Google user signs in, sync them with our public.users table
        try {
          const { user: authUser } = session;
          
          // Check if they exist in our custom public.users table
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();
          if (!existingUser) {
            const intendedRole = localStorage.getItem('oauth_intended_role') || 'passenger';
            localStorage.removeItem('oauth_intended_role'); // Clean up
            
            // New Google User - create their profile
            const { data: newUser, error } = await supabase
              .from('users')
              .insert([{
                email: authUser.email,
                name: authUser.user_metadata?.full_name || 'Google User',
                avatar_url: authUser.user_metadata?.avatar_url || null,
                role: intendedRole,
                email_verified: true
              }])
              .select()
              .single();

            if (!error && newUser) {
              useAuthStore.setState({ user: mapDbUser(newUser), isAuthenticated: true });
            }
          } else {
            // Existing user, just log them in to our state
            useAuthStore.setState({ user: mapDbUser(existingUser), isAuthenticated: true });
          }
        } catch (err) {
          console.error("Error syncing Google Auth with public.users", err);
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
      <ToastContainer />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerificationPage />} />

        {/* Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><AppLayout><SearchPage /></AppLayout></ProtectedRoute>} />
        <Route path="/book/:routeId" element={<ProtectedRoute><AppLayout><BookingPage /></AppLayout></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><AppLayout><MyBookingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><AppLayout><WalletPage /></AppLayout></ProtectedRoute>} />
        <Route path="/daily-report" element={<ProtectedRoute><AppLayout><DailyReportPage /></AppLayout></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><AppLayout><VehiclesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/vehicle/:vehicleId" element={<ProtectedRoute><AppLayout><VehicleDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/tracking" element={<ProtectedRoute><AppLayout><LiveTrackingPage /></AppLayout></ProtectedRoute>} />
        <Route path="/parcel" element={<ProtectedRoute><AppLayout><ParcelPage /></AppLayout></ProtectedRoute>} />
        <Route path="/rentals" element={<ProtectedRoute><AppLayout><RentalPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><AppLayout><DeviceSessionsPage /></AppLayout></ProtectedRoute>} />

        {/* Agent Routes */}
        <Route path="/agent" element={<ProtectedRoute><AppLayout><AgentDashboardPage /></AppLayout></ProtectedRoute>} />

        {/* Owner Routes */}
        <Route path="/owner" element={<ProtectedRoute><AppLayout><OwnerDashboardPage /></AppLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminDashboardPage /></AppLayout></ProtectedRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
