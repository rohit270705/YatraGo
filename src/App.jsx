import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Search, Ticket, Wallet, Car, Package, Users, ShieldCheck,
  LogOut, Menu, X, MapPin, UserCircle, Settings, Bell, ChevronRight,
  Briefcase, TruckIcon, ClipboardList, FileCheck, CreditCard, BarChart3,
  Home, Map, Bike
} from 'lucide-react';
import { useAuthStore, useToastStore } from './store';

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
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
        <div style={{ width: 40 }} />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main">
        <div className="app-content">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// ===== Main App =====
export default function App() {
  return (
    <HashRouter>
      <ToastContainer />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
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
