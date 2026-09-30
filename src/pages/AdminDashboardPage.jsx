import { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, Users, Car, Ticket, Wallet, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, Eye, Ban, DollarSign, FileCheck, BarChart3,
  Bike, UserCheck, UserX, Clock, Search, MapPin, Star, Zap, Filter, Plus, Calendar,
  Settings, Headphones, Tag, Home, MessageSquare, Rocket, Bell
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useVehicleStore, useBookingStore, useWalletStore, useToastStore, useRentalStore, usePlatformStore, useChatStore, useAuthStore, usePromoStore, useSupportStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// Mock users removed

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) setUsers(data);
      } catch (err) {} finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const { vehicles, approveVehicle, rejectVehicle, getPendingApprovals, fetchVehicles } = useVehicleStore();
  const { bookings } = useBookingStore();
  const { transactions, withdrawals, fetchAllWithdrawals, approveWithdrawal, rejectWithdrawal } = useWalletStore();
  const { settings, fetchSettings, updateSetting, launchFeature } = usePlatformStore();
  const { promos, fetchPromos, createPromo, updatePromoStatus } = usePromoStore();
  const { tickets, fetchAllTickets, addMessage, updateTicketStatus } = useSupportStore();
  const { user: currentUser } = useAuthStore();
  const { rentalVehicles, activeRentals } = useRentalStore();
  const { addToast } = useToastStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [vehicleTabFilter, setVehicleTabFilter] = useState('all');
  const [localSettings, setLocalSettings] = useState({});
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [pendingStays, setPendingStays] = useState([]);
  const [aiStatsData, setAiStatsData] = useState([]);
  const [isLoadingAiStats, setIsLoadingAiStats] = useState(false);

  useEffect(() => {
    if (activeSection === 'ai-stats') {
      const fetchAiStats = async () => {
        setIsLoadingAiStats(true);
        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id, sender, content, ai_provider, response_time_ms, fallback_used, fallback_reason, created_at')
            .eq('sender', 'ai')
            .order('created_at', { ascending: false })
            .limit(300);
          if (!error && data) setAiStatsData(data);
        } catch (e) {
          console.error('Error loading AI stats:', e);
        } finally {
          setIsLoadingAiStats(false);
        }
      };
      fetchAiStats();
    }
  }, [activeSection]);

  useEffect(() => {
    fetchVehicles();
    fetchAllWithdrawals();
    fetchPromos();
    fetchAllTickets();
    fetchPendingStays();
    fetchSettings();
  }, [fetchVehicles, fetchAllWithdrawals, fetchPromos, fetchAllTickets, fetchSettings]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);


  const fetchPendingStays = async () => {
    try {
      const { data, error } = await supabase.from('accommodations').select('*').order('created_at', { ascending: false });
      if (!error && data) setPendingStays(data);
    } catch (e) {}
  };

  const handleStayAction = async (id, newStatus) => {
    try {
      const { error } = await supabase.rpc('admin_manage_accommodations', {
        action: 'update_status',
        target_id: id,
        new_status: newStatus,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
      if (!error) {
        addToast(`Homestay ${newStatus}!`, 'success');
        fetchPendingStays();
      }
    } catch (e) {
      addToast('Failed to update status', 'error');
    }
  };

  const pendingVehicles = getPendingApprovals();
  const activeVehicles = vehicles.filter(v => v.approved && v.isActive);
  const totalRevenue = (bookings || []).filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.totalAmount || b.total_amount || 0), 0);
  const totalCommissions = (bookings || []).filter(b => b.isAgentBooking || b.is_agent_booking).reduce((s, b) => s + (b.commissionAmount || b.commission_amount || 0), 0);

  // Combined Vehicle Stats
  const totalTravelVehicles = vehicles.length;
  const totalRentalBikes = rentalVehicles.filter(v => v.category === 'bike').length;
  const totalRentalScooties = rentalVehicles.filter(v => v.category === 'scooty').length;
  const totalAllVehicles = totalTravelVehicles + rentalVehicles.length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    let list = users;
    if (userFilter !== 'all') {
      if (userFilter === 'active') list = list.filter(u => u.status === 'active');
      else if (userFilter === 'inactive') list = list.filter(u => u.status === 'inactive' || u.status === 'suspended');
      else list = list.filter(u => u.role === userFilter);
    }
    if (userSearch) {
      const q = userSearch.toLowerCase();
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, userFilter, userSearch]);

  // Analytics Data Calculation (Last 7 Days)
  const analyticsData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayBookings = (bookings || []).filter(b => {
        const bd = new Date(b.created_at || b.date);
        return bd.getDate() === d.getDate() && bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      });

      data.push({
        day: dayStr,
        vol: dayBookings.length,
        revenue: dayBookings.reduce((sum, b) => sum + (b.totalAmount || b.total_amount || 0), 0)
      });
    }
    return data;
  }, [bookings]);

  // Filtered Vehicles (combined)
  const combinedVehicles = useMemo(() => {
    const travel = vehicles.map(v => ({
      id: v.id,
      name: `${v.type} — ${v.registrationNumber}`,
      type: v.type,
      category: 'travel',
      owner: v.ownerName,
      seats: v.seatingCapacity,
      location: v.journeyHistory?.[0]?.from || '—',
      status: v.approved ? 'Active' : 'Pending',
      statusType: v.approved ? 'success' : 'warning',
      puc: v.puc?.status === 'valid' ? 'Valid' : v.puc?.status === 'expiring_soon' ? 'Expiring' : 'Expired',
      pucType: v.puc?.status === 'valid' ? 'success' : v.puc?.status === 'expiring_soon' ? 'warning' : 'danger',
      regNumber: v.registrationNumber,
    }));

    const rental = rentalVehicles.map(v => ({
      id: v.id,
      name: v.name,
      type: v.category === 'bike' ? 'Bike' : 'Scooty',
      category: 'rental',
      owner: v.brand,
      seats: v.category === 'bike' ? '1-2' : '1-2',
      location: v.location,
      status: v.available ? 'Available' : 'Rented',
      statusType: v.available ? 'success' : 'info',
      puc: v.fuelType === 'Electric' ? 'EV' : 'N/A',
      pucType: v.fuelType === 'Electric' ? 'teal' : 'secondary',
      regNumber: v.id.toUpperCase(),
    }));

    let combined = [...travel, ...rental];

    if (vehicleTabFilter === 'travel') combined = combined.filter(v => v.category === 'travel');
    else if (vehicleTabFilter === 'bike') combined = combined.filter(v => v.type === 'Bike');
    else if (vehicleTabFilter === 'scooty') combined = combined.filter(v => v.type === 'Scooty');

    return combined;
  }, [vehicles, rentalVehicles, vehicleTabFilter]);

  const activeUserCount = users.filter(u => u.status === 'active').length;

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'all-vehicles', label: `All Vehicles (${totalAllVehicles})`, icon: Car },
    { id: 'approvals', label: `Approvals (${pendingVehicles.length})`, icon: FileCheck },
    { id: 'bookings', label: 'Bookings', icon: Ticket },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'promos', label: 'Promos', icon: Tag },
    { id: 'homestays', label: `Homestays (${pendingStays.filter(s => s.status === 'pending').length})`, icon: Home },
    { id: 'support', label: 'Help Desk', icon: Headphones },
    { id: 'ai-stats', label: 'AI Stats', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleApprove = async (vehicleId) => {
    const { success, error } = await approveVehicle(vehicleId);
    if (success) {
      addToast('Vehicle approved and now live on platform!', 'success');
    } else {
      addToast(error || 'Failed to approve vehicle', 'error');
    }
  };

  const handleReject = async (vehicleId) => {
    const { success, error } = await rejectVehicle(vehicleId);
    if (success) {
      addToast('Vehicle registration rejected.', 'warning');
    } else {
      addToast(error || 'Failed to reject vehicle', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'passenger': return <span className="badge badge-teal" style={{ fontSize: '0.6rem' }}>🧳 Passenger</span>;
      case 'agent': return <span className="badge badge-purple" style={{ fontSize: '0.6rem' }}>💼 Agent</span>;
      case 'owner': return <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>🚗 Owner</span>;
      case 'admin': return <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>🛡️ Admin</span>;
      default: return <span className="badge">{role}</span>;
    }
  };

  const getStatusBadge = (user) => {
    const status = user?.status || 'active';
    let badge;
    switch (status) {
      case 'active': badge = <span className="badge badge-success" style={{ fontSize: '0.6rem' }}><UserCheck size={10} /> Active</span>; break;
      case 'inactive': badge = <span className="badge badge-secondary" style={{ fontSize: '0.6rem' }}><UserX size={10} /> Inactive</span>; break;
      case 'suspended': badge = <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}><Ban size={10} /> Suspended</span>; break;
      default: badge = <span className="badge">{status}</span>; break;
    }

    if (user?.role === 'agent' && user?.kyc_verified) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          {badge}
          <span className="badge badge-primary" style={{ fontSize: '0.55rem', background: 'rgba(52, 152, 219, 0.15)', color: 'var(--color-accent-blue)' }}><CheckCircle size={8} /> KYC Verified</span>
        </div>
      );
    }
    return badge;
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      const { error } = await supabase.rpc('update_user_status_admin', {
        target_user_id: userId,
        new_status: newStatus,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      addToast(`User marked as ${newStatus}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleVerifyKYC = async (userId, isVerified) => {
    try {
      const { error } = await supabase.rpc('update_user_kyc_admin', {
        target_user_id: userId,
        is_verified: isVerified,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, kyc_verified: isVerified } : u));
      addToast(`Agent KYC ${isVerified ? 'Verified' : 'Unverified'}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLaunchFeature = async (featureName) => {
    const featureLabel = featureName === 'flights' ? 'Flight Booking' : 'Train Booking';
    if (!window.confirm(`Are you sure you want to mark ${featureLabel} as LIVE and notify all subscribed users?`)) {
      return;
    }
    try {
      const count = await launchFeature(featureName);
      addToast(`🎉 ${featureLabel} marked as LIVE! Sent notifications to ${count} subscribed user(s).`, 'success');
      fetchSettings();
    } catch (err) {
      console.error('Launch failed:', err);
      addToast('Failed to launch feature or dispatch notifications.', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 12, paddingBottom: 8 }}>
        <h1 style={{ marginBottom: 4 }}>Admin Panel</h1>
        <p style={{ fontSize: '13px', margin: 0 }}>Platform management and oversight</p>
      </div>

      {/* Section Tabs */}
      <div className="admin-tabs-bar">
        {sections.map(sec => (
          <button key={sec.id} className={`btn ${activeSection === sec.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection(sec.id)}>
            <sec.icon size={16} /> <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeSection === 'overview' && (
        <>
          {/* Top Stats */}
          {isLoadingUsers ? (
            <div className="stats-grid">
              <SkeletonLoader type="stats-card" count={6} />
            </div>
          ) : (
            <div className="stats-grid stagger-children">
              <div className="stat-card">
                <div className="stat-card-icon teal"><Users size={22} /></div>
                <div className="stat-card-label">Active Users</div>
                <div className="stat-card-value">{activeUserCount}</div>
                <div className="stat-card-change positive">of {users.length} total</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon blue"><Car size={22} /></div>
                <div className="stat-card-label">Total Vehicles</div>
                <div className="stat-card-value">{totalAllVehicles}</div>
                <div className="stat-card-change positive">{totalTravelVehicles} travel + {rentalVehicles.length} rental</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon green"><TrendingUp size={22} /></div>
                <div className="stat-card-label">Total Revenue</div>
                <div className="stat-card-value">₹{(totalRevenue + 87500).toLocaleString()}</div>
                <div className="stat-card-change positive">↑ 8% this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon purple"><Ticket size={22} /></div>
                <div className="stat-card-label">Total Bookings</div>
                <div className="stat-card-value">{bookings.length + 342}</div>
                <div className="stat-card-change positive">↑ 15% this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon amber"><DollarSign size={22} /></div>
                <div className="stat-card-label">Agent Commissions</div>
                <div className="stat-card-value">₹{(totalCommissions + 4500).toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon red"><AlertTriangle size={22} /></div>
                <div className="stat-card-label">Pending Approvals</div>
                <div className="stat-card-value">{pendingVehicles.length}</div>
              </div>
            </div>
          )}

          {/* Vehicle Breakdown Card */}
          <div className="glass-card" style={{ marginTop: 24, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
              <Car size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Vehicle Fleet Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {[
                { label: 'Tours & Travel', count: totalTravelVehicles, icon: '🚗', sub: `${activeVehicles.length} active`, color: 'rgba(27, 153, 139, 0.12)' },
                { label: 'Rental Bikes', count: totalRentalBikes, icon: '🏍️', sub: `${rentalVehicles.filter(v => v.category === 'bike' && v.available).length} available`, color: 'rgba(155, 89, 182, 0.12)' },
                { label: 'Rental Scooties', count: totalRentalScooties, icon: '🛵', sub: `${rentalVehicles.filter(v => v.category === 'scooty' && v.available).length} available`, color: 'rgba(52, 152, 219, 0.12)' },
                { label: 'Electric Vehicles', count: rentalVehicles.filter(v => v.fuelType === 'Electric').length, icon: '⚡', sub: 'Eco-friendly', color: 'rgba(46, 204, 113, 0.12)' },
                { label: 'Active Rentals', count: activeRentals.length, icon: '🔑', sub: 'Currently rented', color: 'rgba(244, 162, 97, 0.12)' },
                { label: 'Pending Approval', count: pendingVehicles.length, icon: '⏳', sub: 'Needs review', color: 'rgba(231, 76, 60, 0.12)' },
              ].map(item => (
                <div key={item.label} style={{
                  background: item.color, borderRadius: 'var(--radius-md)',
                  padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{item.count}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* Booking Volume */}
            <div className="glass-card" style={{ height: 350 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
                <TrendingUp size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Booking Volume (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(52, 152, 219, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="vol" fill="#3498db" radius={[4, 4, 0, 0]}>
                    {analyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.vol > 0 ? '#3498db' : '#243044'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Platform Revenue */}
            <div className="glass-card" style={{ height: 350 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
                <DollarSign size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                Platform Revenue (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip formatter={(value) => [`₹${value}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#2ecc71" strokeWidth={3} dot={{ r: 4, fill: '#2ecc71', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Breakdown */}
          <div className="glass-card section-block">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
              <Users size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              User Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Passengers', count: users.filter(u => u.role === 'passenger').length, icon: '🧳', color: 'rgba(27, 153, 139, 0.12)' },
                { label: 'Agents', count: users.filter(u => u.role === 'agent').length, icon: '💼', color: 'rgba(155, 89, 182, 0.12)' },
                { label: 'Vehicle Owners', count: users.filter(u => u.role === 'owner').length, icon: '🚗', color: 'rgba(52, 152, 219, 0.12)' },
                { label: 'Active Now', count: activeUserCount, icon: '🟢', color: 'rgba(46, 204, 113, 0.12)' },
                { label: 'Suspended', count: users.filter(u => u.status === 'suspended').length, icon: '🔴', color: 'rgba(231, 76, 60, 0.12)' },
              ].map(item => (
                <div key={item.label} style={{
                  background: item.color, borderRadius: 'var(--radius-md)',
                  padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: 2 }}>{item.icon}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{item.count}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Platform Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🎫', text: 'New booking: Mumbai → Pune by Arjun Mehta', time: '2 min ago' },
              { icon: '🚗', text: 'Vehicle GJ-05-GH-3456 pending approval', time: '15 min ago' },
              { icon: '🏍️', text: 'Royal Enfield Classic 350 rented by Sneha Patel', time: '30 min ago' },
              { icon: '💰', text: 'Wallet top-up: ₹5,000 by Kavita Nair', time: '1 hour ago' },
              { icon: '🛵', text: 'Ather 450X returned by Meena Krishnan', time: '2 hours ago' },
              { icon: '❌', text: 'Booking BK-ABC123 cancelled, ₹620 refunded', time: '2 hours ago' },
              { icon: '✅', text: 'Vehicle MH-12-AB-1234 documents verified', time: '3 hours ago' },
            ].map((activity, i) => (
              <div key={i} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.25rem' }}>{activity.icon}</span>
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{activity.text}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{activity.time}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== ACTIVE USERS ===== */}
      {activeSection === 'users' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontWeight: 700 }}>
              <Users size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              All Platform Users ({filteredUsers.length})
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input className="form-input" placeholder="Search users..." value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ paddingLeft: 30, height: 34, fontSize: '0.8rem', width: 200 }} />
              </div>
              <select className="form-select" value={userFilter} onChange={e => setUserFilter(e.target.value)}
                style={{ height: 34, fontSize: '0.8rem', width: 'auto', padding: '4px 28px 4px 8px' }}>
                <option value="all">All Roles</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive/Suspended</option>
                <option value="passenger">Passengers</option>
                <option value="agent">Agents</option>
                <option value="owner">Owners</option>
              </select>
            </div>
          </div>

          {/* User Stats Row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Active', count: users.filter(u => u.status === 'active').length, color: 'var(--color-accent-green)' },
              { label: 'Inactive', count: users.filter(u => u.status === 'inactive').length, color: 'var(--color-text-tertiary)' },
              { label: 'Suspended', count: users.filter(u => u.status === 'suspended').length, color: 'var(--color-accent-red)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)',
                padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.count}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>City</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--gradient-accent)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                        }}>{(user.name || '?')[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name || '—'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{user.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                      {user.city || '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{user.bookings ?? '—'}</td>
                    <td>{getStatusBadge(user)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      <Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                      {user.last_active ? new Date(user.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : user.lastActive || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : user.joinDate || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(!user.status || user.status === 'active') ? (
                          <button className="btn btn-sm" style={{ background: 'rgba(231, 76, 60, 0.15)', color: 'var(--color-accent-red)', border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleUserStatusChange(user.id, 'suspended')}>
                            Suspend
                          </button>
                        ) : (
                          <button className="btn btn-sm" style={{ background: 'rgba(46, 204, 113, 0.15)', color: 'var(--color-accent-green)', border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleUserStatusChange(user.id, 'active')}>
                            Activate
                          </button>
                        )}
                        
                        {user.role === 'agent' && (
                          <button className="btn btn-sm" style={{ background: 'rgba(52, 152, 219, 0.15)', color: 'var(--color-accent-blue)', border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleVerifyKYC(user.id, !user.kyc_verified)}>
                            {user.kyc_verified ? 'Unverify KYC' : 'Verify KYC'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== ALL VEHICLES (Travel + Rental) ===== */}
      {activeSection === 'all-vehicles' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontWeight: 700 }}>
              All Registered Vehicles ({combinedVehicles.length})
            </h3>
          </div>

          {/* Vehicle Stats Row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${totalAllVehicles})`, icon: '🚀' },
              { id: 'travel', label: `Travel (${totalTravelVehicles})`, icon: '🚗' },
              { id: 'bike', label: `Bikes (${totalRentalBikes})`, icon: '🏍️' },
              { id: 'scooty', label: `Scooties (${totalRentalScooties})`, icon: '🛵' },
            ].map(tab => (
              <button key={tab.id}
                className={`btn btn-sm ${vehicleTabFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setVehicleTabFilter(tab.id)}
                style={{ fontSize: '0.8rem' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Combined Vehicles Table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Owner/Brand</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>PUC/Fuel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {combinedVehicles.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{v.regNumber}</div>
                    </td>
                    <td>
                      <span className={`badge ${v.category === 'travel' ? 'badge-teal' : 'badge-purple'}`}
                        style={{ fontSize: '0.6rem' }}>
                        {v.category === 'travel' ? '🚗 Travel' : '🏍️ Rental'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{v.type}</td>
                    <td style={{ fontSize: '0.85rem' }}>{v.owner}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 2 }} />
                      {v.location}
                    </td>
                    <td>{v.seats}</td>
                    <td>
                      <span className={`badge badge-${v.pucType}`} style={{ fontSize: '0.6rem' }}>
                        {v.puc}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${v.statusType}`} style={{ fontSize: '0.6rem' }}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== APPROVALS ===== */}
      {activeSection === 'approvals' && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            <FileCheck size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Vehicle Registration Approvals
          </h3>
          {pendingVehicles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
              <CheckCircle size={36} color="var(--color-accent-green)" style={{ marginBottom: 12 }} />
              <h4 style={{ fontWeight: 600, marginBottom: 8 }}>All caught up!</h4>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
                No pending vehicle approvals at the moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingVehicles.map(vehicle => (
                <div key={vehicle.id} className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Car size={36} color="var(--color-accent-amber)" />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{vehicle.registrationNumber}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                        {vehicle.type} • {vehicle.seatingCapacity} seats • {vehicle.luggageCapacity}kg luggage
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Owner: <strong>{vehicle.ownerName || 'N/A'}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(vehicle.id)}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(vehicle.id)}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                      Submitted Documents
                    </div>
                    <div className="doc-status-grid">
                      {[
                        { name: 'RC Book', num: vehicle.documents?.rc?.number, expiry: null, photoUrl: vehicle.documents?.rc?.photoUrl },
                        { name: 'PUC Certificate', num: vehicle.documents?.puc?.number, expiry: vehicle.documents?.puc?.validUntil, photoUrl: vehicle.documents?.puc?.photoUrl },
                        { name: 'Driving License', num: vehicle.documents?.dl?.number, expiry: vehicle.documents?.dl?.validUntil, photoUrl: vehicle.documents?.dl?.photoUrl },
                      ].map((doc, i) => (
                        <div key={i} className="doc-status-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
                            <div className="doc-icon" style={{ background: 'rgba(27, 153, 139, 0.12)', color: 'var(--color-accent-teal-light)' }}>
                              <FileCheck size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="doc-name">{doc.name}</div>
                              <div className="doc-expiry">{doc.num || 'N/A'} {doc.expiry ? `• Exp: ${doc.expiry}` : ''}</div>
                            </div>
                          </div>
                          {doc.photoUrl ? (
                            <div style={{ width: '100%', height: 120, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-surface-hover)', cursor: 'pointer' }} onClick={() => window.open(doc.photoUrl, '_blank')}>
                              <img src={doc.photoUrl} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} title="Click to view full size" />
                            </div>
                          ) : (
                            <div style={{ width: '100%', padding: '12px', textAlign: 'center', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                              No photo uploaded
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== BOOKINGS ===== */}
      {activeSection === 'bookings' && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>All Platform Bookings</h3>
          {bookings.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--color-text-tertiary)' }}>No bookings yet.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Route</th>
                    <th>Date</th>
                    <th>Passenger</th>
                    <th>Amount</th>
                    <th>Agent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.id}</td>
                      <td>{b.route.from} → {b.route.to}</td>
                      <td>{b.route.date}</td>
                      <td>{Array.isArray(b.passengerDetails) ? `${b.passengerDetails[0]?.name} ${b.passengerDetails.length > 1 ? `+${b.passengerDetails.length - 1}` : ''}` : b.passengerDetails.name}</td>
                      <td style={{ fontWeight: 600 }}>₹{b.totalAmount}</td>
                      <td>{b.isAgentBooking ? `Yes (₹${b.commissionAmount})` : 'No'}</td>
                      <td>
                        <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-teal'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== WALLETS ===== */}
      {activeSection === 'wallets' && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Platform Wallets Overview</h3>
          <div className="stats-grid section-block">
            <div className="stat-card">
              <div className="stat-card-icon green"><Wallet size={22} /></div>
              <div className="stat-card-label">Total Platform Balance</div>
              <div className="stat-card-value">₹{(users.reduce((sum, u) => sum + (u.bookings * 1500 + 5000), 0)).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon amber"><DollarSign size={22} /></div>
              <div className="stat-card-label">Agent Commissions</div>
              <div className="stat-card-value">₹{(totalCommissions + 4500).toLocaleString()}</div>
            </div>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Pending Withdrawal Requests</h4>
          <div className="data-table-wrapper section-block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Bank Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals?.filter(w => w.status === 'pending').length > 0 ? (
                  withdrawals.filter(w => w.status === 'pending').map(w => (
                    <tr key={w.id}>
                      <td>{new Date(w.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{w.user?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{w.user?.email || w.user_id}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-accent-teal)' }}>₹{w.amount.toLocaleString()}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>A/C: {w.bank_account}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>IFSC: {w.ifsc_code}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm" style={{ background: 'rgba(46, 204, 113, 0.15)', color: 'var(--color-accent-green)', border: 'none' }}
                            onClick={async () => {
                              const res = await approveWithdrawal(w.id);
                              if (res.success) addToast('Withdrawal approved', 'success');
                              else addToast(res.error, 'error');
                            }}>Approve</button>
                          <button className="btn btn-sm" style={{ background: 'rgba(231, 76, 60, 0.15)', color: 'var(--color-accent-red)', border: 'none' }}
                            onClick={async () => {
                              const res = await rejectWithdrawal(w);
                              if (res.success) addToast('Withdrawal rejected', 'success');
                              else addToast(res.error, 'error');
                            }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>No pending withdrawal requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <h4 style={{ fontWeight: 600, marginBottom: 12 }}>User Wallet Balances</h4>
          <div className="data-table-wrapper section-block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Current Balance</th>
                  <th>Total Transactions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const mockBalance = (u.bookings * 1500) + 5000;
                  const mockTxnCount = u.bookings * 2 + 1;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-accent-teal)' }}>₹{mockBalance.toLocaleString()}</td>
                      <td>{mockTxnCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Recent System Transactions</h4>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{txn.id.slice(0, 12)}...</td>
                    <td style={{ fontWeight: 600 }}>Current User</td>
                    <td>
                      <span className={`badge ${txn.type === 'WALLET_TOPUP' ? 'badge-success'
                        : txn.type === 'TICKET_PAYMENT' ? 'badge-danger'
                        : txn.type === 'TICKET_REFUND' ? 'badge-info'
                        : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                        {txn.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: 600,
                      color: txn.amount > 0 ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                    }}>
                      {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{txn.description}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* ===== HOMESTAYS APPROVAL ===== */}
      {activeSection === 'homestays' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700 }}>Pay-and-Stay Homestay Listings</h3>
          </div>
          {pendingStays.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Home size={36} /></div>
              <h3>No homestay listings yet</h3>
            </div>
          ) : (
            <div className="route-grid">
              {pendingStays.map(stay => (
                <div key={stay.id} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h4 style={{ margin: 0 }}>{stay.name}</h4>
                    <span style={{ 
                      fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                      background: stay.status === 'approved' ? 'rgba(16,185,129,0.1)' : stay.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: stay.status === 'approved' ? '#10b981' : stay.status === 'rejected' ? '#ef4444' : '#f59e0b'
                    }}>{stay.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    <strong>Type:</strong> {stay.type} &bull; <strong>Budget:</strong> {stay.budget_category}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    <strong>Destination:</strong> {stay.destination} &bull; <strong>Price:</strong> ₹{stay.price_per_night}/night
                  </div>
                  {stay.description && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{stay.description}</p>}
                  {stay.house_rules && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Rules: {stay.house_rules}</p>}
                  {stay.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleStayAction(stay.id, 'approved')}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => handleStayAction(stay.id, 'rejected')}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {/* ===== PROMOS ===== */}
      {activeSection === 'promos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700 }}><Tag size={20} style={{ display: 'inline', marginRight: 8 }} /> Promo Codes</h3>
            <button className="btn btn-primary" onClick={async () => {
              const code = prompt('Enter new promo code (e.g. SUMMER20):');
              if (!code) return;
              const type = prompt('Enter discount type (percentage/fixed):', 'percentage');
              if (!type) return;
              const amount = prompt('Enter discount amount/percent:');
              if (!amount) return;
              const limit = prompt('Enter usage limit (e.g. 100):', '100');
              
              const newPromo = {
                code: code.toUpperCase(),
                discount_type: type,
                discount_amount: Number(amount),
                usage_limit: limit ? Number(limit) : null,
                times_used: 0,
                is_active: true
              };

              const res = await createPromo(newPromo);
              if (res.success) {
                addToast('Promo created successfully', 'success');
              } else {
                addToast(res.error, 'error');
              }
            }}>
              <Plus size={18} /> Create Promo
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, letterSpacing: 1 }}>{p.code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-accent-green)' }}>
                      {p.discount_type === 'percentage' ? `${p.discount_amount}% OFF` : `₹${p.discount_amount} OFF`}
                    </td>
                    <td>{p.times_used} / {p.usage_limit || '∞'}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: 'none' }}
                        onClick={() => {
                          updatePromoStatus(p.id, !p.is_active);
                          addToast(`Promo ${p.is_active ? 'disabled' : 'enabled'}`, 'success');
                        }}>Toggle</button>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>No promo codes exist yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== SUPPORT HELP DESK ===== */}
      {activeSection === 'support' && (
        <div className="flex flex-col md:flex-row h-[600px] bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
          <div className="w-full md:w-[350px] border-b md:border-b-0 md:border-r border-[var(--color-border)] flex flex-col max-h-[250px] md:max-h-full shrink-0">
            <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
              <Headphones size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Support Tickets ({tickets.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tickets.map(t => (
                <div key={t.id} 
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{ 
                    padding: 16, borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                    background: selectedTicketId === t.id ? 'var(--color-bg-secondary)' : 'transparent'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.subject}</div>
                    <span className={`badge ${
                      t.status === 'open' ? 'badge-primary' : 
                      t.status === 'in_progress' ? 'badge-warning' : 
                      'badge-success'
                    }`} style={{ fontSize: '0.6rem' }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>User ID: {t.user_id.slice(0, 8)}...</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{new Date(t.created_at).toLocaleString()}</div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No support tickets exist.</div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedTicketId ? (
              <>
                <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>Ticket ID: {selectedTicketId.slice(0,8)}...</div>
                  <select 
                    className="form-input" 
                    style={{ width: 'auto', padding: '4px 8px' }}
                    value={tickets.find(t => t.id === selectedTicketId)?.status || 'open'}
                    onChange={(e) => {
                      updateTicketStatus(selectedTicketId, e.target.value);
                      addToast('Ticket status updated', 'success');
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(tickets.find(t => t.id === selectedTicketId)?.messages_json || []).map((m, idx) => (
                    <div key={idx} style={{ 
                      alignSelf: m.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                      background: m.sender_role === 'admin' ? 'var(--gradient-primary)' : 'var(--color-bg-secondary)',
                      color: m.sender_role === 'admin' ? 'white' : 'inherit',
                      padding: '10px 14px', borderRadius: 12, maxWidth: '80%'
                    }}>
                      <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {m.sender_role === 'admin' ? 'Admin' : 'User'} &bull; {new Date(m.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
                  <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Type reply..." value={adminReply} onChange={e => setAdminReply(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && adminReply.trim()) {
                      addMessage(selectedTicketId, { sender_role: 'admin', content: adminReply, timestamp: new Date().toISOString() });
                      setAdminReply('');
                    }
                  }} />
                  <button className="btn btn-primary" onClick={() => {
                    if (adminReply.trim()) {
                      addMessage(selectedTicketId, { sender_role: 'admin', content: adminReply, timestamp: new Date().toISOString() });
                      setAdminReply('');
                    }
                  }}><MessageSquare size={16} /> Send</button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                Select a ticket to view messages
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== AI STATS ===== */}
      {activeSection === 'ai-stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}><MessageSquare size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Yaara AI Usage & Routing Stats</h3>
            <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Privacy-First 4-Provider Router (DPDP Act 2023)</span>
          </div>

          {isLoadingAiStats ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-tertiary)' }}>Loading AI usage statistics...</div>
          ) : aiStatsData.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-tertiary)' }}>No AI chat activity recorded yet. Start chatting in the AI widget to see live metrics!</div>
          ) : (
            <>
              {/* Stat cards grid */}
              <div className="stats-grid stagger-children">
                <div className="stat-card">
                  <div className="stat-card-icon teal"><Zap size={22} /></div>
                  <div className="stat-card-label">Total AI Responses</div>
                  <div className="stat-card-value">{aiStatsData.length}</div>
                  <div className="stat-card-change positive">Tracked across sessions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon purple"><TrendingUp size={22} /></div>
                  <div className="stat-card-label">Fallback Rate</div>
                  <div className="stat-card-value">{((aiStatsData.filter(m => m.fallback_used).length / aiStatsData.length) * 100).toFixed(1)}%</div>
                  <div className="stat-card-change" style={{ color: 'var(--color-text-tertiary)' }}>{aiStatsData.filter(m => m.fallback_used).length} routed fallbacks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon blue"><Clock size={22} /></div>
                  <div className="stat-card-label">Avg Latency</div>
                  <div className="stat-card-value">{Math.round(aiStatsData.reduce((acc, m) => acc + (m.response_time_ms || 0), 0) / aiStatsData.length)} ms</div>
                  <div className="stat-card-change positive">Fast response SLA</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon green"><CheckCircle size={22} /></div>
                  <div className="stat-card-label">Primary (Gemini) Rate</div>
                  <div className="stat-card-value">{((aiStatsData.filter(m => m.ai_provider === 'gemini').length / aiStatsData.length) * 100).toFixed(1)}%</div>
                  <div className="stat-card-change positive">{aiStatsData.filter(m => m.ai_provider === 'gemini').length} direct hits</div>
                </div>
              </div>

              {/* Provider Distribution & Fallback Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-card">
                  <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Provider Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Google Gemini 2.0 Flash (Primary)', key: 'gemini', color: '#10b981', count: aiStatsData.filter(m => m.ai_provider === 'gemini').length },
                      { name: 'Groq Llama 3.3 70B (Speed Fallback)', key: 'groq', color: '#f59e0b', count: aiStatsData.filter(m => m.ai_provider === 'groq').length },
                      { name: 'ChatGPT GPT-4o mini (Complex)', key: 'openai', color: '#3b82f6', count: aiStatsData.filter(m => m.ai_provider === 'openai').length },
                      { name: 'Claude Haiku (Emergency Fallback)', key: 'claude', color: '#8b5cf6', count: aiStatsData.filter(m => m.ai_provider === 'claude').length },
                      { name: 'Offline / Error Fallback', key: 'error', color: '#ef4444', count: aiStatsData.filter(m => m.ai_provider === 'error' || !m.ai_provider).length },
                    ].map(p => {
                      const pct = aiStatsData.length > 0 ? ((p.count / aiStatsData.length) * 100).toFixed(1) : 0;
                      return (
                        <div key={p.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                            <span>{p.count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: 'var(--color-bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: p.color, transition: 'width 0.3s' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card">
                  <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Routing & Fallback Reasons</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Direct Primary (No Fallback)', count: aiStatsData.filter(m => !m.fallback_used && m.ai_provider === 'gemini').length, color: '#10b981' },
                      { name: 'Complex Query Auto-Route (ChatGPT)', count: aiStatsData.filter(m => m.fallback_reason === 'complex_query').length, color: '#3b82f6' },
                      { name: 'Rate Limit Switch', count: aiStatsData.filter(m => m.fallback_reason === 'rate_limit').length, color: '#f59e0b' },
                      { name: 'API Error / Timeout Switch', count: aiStatsData.filter(m => m.fallback_reason === 'error').length, color: '#ef4444' },
                    ].map((r, idx) => {
                      const pct = aiStatsData.length > 0 ? ((r.count / aiStatsData.length) * 100).toFixed(1) : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
                            <span style={{ fontWeight: 500 }}>{r.name}</span>
                            <span>{r.count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: 'var(--color-bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: r.color, transition: 'width 0.3s' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '12px', color: '#10b981' }}>
                    🔒 <strong>Privacy Compliance Active:</strong> All user queries are sanitized via <code>sanitizeUserContext</code> before transmission. DeepSeek is permanently excluded under DPDP Act 2023.
                  </div>
                </div>
              </div>

              {/* Recent AI Logs Table */}
              <div className="glass-card">
                <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Recent AI Response Logs</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '10px 12px', fontSize: '12px' }}>Time</th>
                        <th style={{ padding: '10px 12px', fontSize: '12px' }}>Provider</th>
                        <th style={{ padding: '10px 12px', fontSize: '12px' }}>Latency</th>
                        <th style={{ padding: '10px 12px', fontSize: '12px' }}>Routing / Fallback</th>
                        <th style={{ padding: '10px 12px', fontSize: '12px' }}>Response Snippet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiStatsData.slice(0, 15).map((log, index) => (
                        <tr key={log.id || index} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="badge" style={{
                              background: log.ai_provider === 'gemini' ? 'rgba(16,185,129,0.15)' : log.ai_provider === 'groq' ? 'rgba(245,158,11,0.15)' : log.ai_provider === 'openai' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                              color: log.ai_provider === 'gemini' ? '#10b981' : log.ai_provider === 'groq' ? '#f59e0b' : log.ai_provider === 'openai' ? '#3b82f6' : '#8b5cf6',
                              padding: '4px 8px', borderRadius: '4px', fontWeight: 600
                            }}>
                              {log.ai_provider === 'gemini' ? 'Gemini 2.0' : log.ai_provider === 'groq' ? 'Groq Llama' : log.ai_provider === 'openai' ? 'ChatGPT' : log.ai_provider === 'claude' ? 'Claude' : 'Error'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{log.response_time_ms || 0} ms</td>
                          <td style={{ padding: '10px 12px' }}>
                            {log.fallback_used ? (
                              <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 500 }}>
                                ⚠️ {log.fallback_reason === 'complex_query' ? 'Complex Query' : log.fallback_reason === 'rate_limit' ? 'Rate Limit Switch' : 'API Error Switch'}
                              </span>
                            ) : (
                              <span style={{ color: '#10b981', fontSize: '12px' }}>✅ Direct Primary</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.content}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== SETTINGS ===== */}
      {activeSection === 'settings' && (
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-card">
            <h3 style={{ fontWeight: 700, marginBottom: 24 }}><Settings size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Platform Global Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label className="form-label">Agent Commission Rate (%)</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Percentage commission rate for agents when they book tickets.</div>
                <input type="number" className="form-input" value={localSettings.AGENT_COMMISSION_PERCENT || ''} onChange={e => setLocalSettings({...localSettings, AGENT_COMMISSION_PERCENT: e.target.value})} />
              </div>
              
              <div>
                <label className="form-label">Owner Platform Fee Flat (₹)</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Fixed flat fee deducted from owner payouts per booking.</div>
                <input type="number" className="form-input" value={localSettings.PLATFORM_FEE_FIXED || ''} onChange={e => setLocalSettings({...localSettings, PLATFORM_FEE_FIXED: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Cancellation Fee Max (₹)</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Max transport deduction for cancellations within 24 hours.</div>
                <input type="number" className="form-input" value={localSettings.CANCELLATION_FEE_MAX || ''} onChange={e => setLocalSettings({...localSettings, CANCELLATION_FEE_MAX: e.target.value})} />
              </div>
              
              <div>
                <label className="form-label">Support Email</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Official email address for user support.</div>
                <input type="email" className="form-input" value={localSettings.SUPPORT_EMAIL || ''} onChange={e => setLocalSettings({...localSettings, SUPPORT_EMAIL: e.target.value})} />
              </div>

              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={async () => {
                try {
                  for (const [key, val] of Object.entries(localSettings)) {
                    await updateSetting(key, val);
                  }
                  addToast('Settings updated successfully!', 'success');
                } catch (e) { addToast('Error updating settings', 'error'); }
              }}>Save Changes</button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={20} className="text-amber-400" /> Feature Launch Management
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Triggering a launch will mark the feature as live and automatically dispatch a "Feature is now live!" notification to all users subscribed in feature_interest.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
                    ✈️ Flight Reservations
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Status: <span style={{ color: localSettings.FLIGHTS_LIVE === 'true' || localSettings.FLIGHTS_LIVE === true ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{localSettings.FLIGHTS_LIVE === 'true' || localSettings.FLIGHTS_LIVE === true ? 'LIVE 🟢' : 'Coming Soon 🟡'}</span>
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${localSettings.FLIGHTS_LIVE === 'true' || localSettings.FLIGHTS_LIVE === true ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleLaunchFeature('flights')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Bell size={14} /> {localSettings.FLIGHTS_LIVE === 'true' || localSettings.FLIGHTS_LIVE === true ? 'Dispatch Notice Again' : 'Launch Flights 🚀'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
                    🚂 IRCTC Train Bookings
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Status: <span style={{ color: localSettings.TRAINS_LIVE === 'true' || localSettings.TRAINS_LIVE === true ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{localSettings.TRAINS_LIVE === 'true' || localSettings.TRAINS_LIVE === true ? 'LIVE 🟢' : 'Coming Soon 🟡'}</span>
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${localSettings.TRAINS_LIVE === 'true' || localSettings.TRAINS_LIVE === true ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleLaunchFeature('trains')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Bell size={14} /> {localSettings.TRAINS_LIVE === 'true' || localSettings.TRAINS_LIVE === true ? 'Dispatch Notice Again' : 'Launch Trains 🚀'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
