import { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, Users, Car, Ticket, Wallet, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, Eye, Ban, DollarSign, FileCheck, BarChart3,
  Bike, UserCheck, UserX, Clock, Search, MapPin, Star, Zap, Filter, Plus, Calendar,
  Settings, Headphones, Tag, Home
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useVehicleStore, useBookingStore, useWalletStore, useToastStore, useRentalStore, usePlatformStore, useChatStore, useAuthStore } from '../store';

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
  const { settings } = usePlatformStore();
  const { conversations, messages, fetchAdminConversations, sendMessage } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const { rentalVehicles, activeRentals } = useRentalStore();
  const { addToast } = useToastStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [vehicleTabFilter, setVehicleTabFilter] = useState('all');
  const [localSettings, setLocalSettings] = useState({});
  const [promoCodes, setPromoCodes] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [pendingStays, setPendingStays] = useState([]);

  useEffect(() => {
    fetchVehicles();
    fetchAllWithdrawals();
    fetchAdminConversations();
    fetchPromoCodes();
    fetchPendingStays();
  }, [fetchVehicles, fetchAllWithdrawals, fetchAdminConversations]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
      if (!error && data) setPromoCodes(data);
    } catch (e) {}
  };

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
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.city.toLowerCase().includes(q));
    }
    return list;
  }, [userFilter, userSearch]);

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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Platform management and oversight</p>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {sections.map(sec => (
          <button key={sec.id} className={`btn btn-sm ${activeSection === sec.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection(sec.id)} style={{ fontSize: '0.8rem' }}>
            <sec.icon size={14} /> {sec.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeSection === 'overview' && (
        <>
          {/* Top Stats */}
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

          {/* Analytics Chart */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
              <TrendingUp size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Booking Volume (Last 7 Days)
            </h3>
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '20px 0', borderBottom: '1px solid var(--color-border)' }}>
              {[
                { day: 'Mon', vol: 45, max: 120 },
                { day: 'Tue', vol: 52, max: 120 },
                { day: 'Wed', vol: 38, max: 120 },
                { day: 'Thu', vol: 65, max: 120 },
                { day: 'Fri', vol: 89, max: 120 },
                { day: 'Sat', vol: 110, max: 120 },
                { day: 'Sun', vol: 95, max: 120 },
              ].map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: '100%',
                    maxWidth: 40,
                    height: `${(d.vol / d.max) * 150}px`,
                    background: 'var(--gradient-primary)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 1s ease-out'
                  }} title={`${d.vol} bookings`} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>{d.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* User Breakdown */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
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
                        }}>{user.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                      {user.city}
                    </td>
                    <td style={{ fontWeight: 600 }}>{user.bookings}</td>
                    <td>{getStatusBadge(user)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      <Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                      {user.lastActive}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{user.joinDate}</td>
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
          <div className="stats-grid" style={{ marginBottom: 24 }}>
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
          <div className="data-table-wrapper" style={{ marginBottom: 32 }}>
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
          <div className="data-table-wrapper" style={{ marginBottom: 32 }}>
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
            <h3 style={{ fontWeight: 700 }}>Promo Codes & Discounts</h3>
            <button className="btn btn-primary" onClick={async () => {
              const code = prompt('Enter new promo code (e.g. SUMMER20):');
              if (!code) return;
              const discount = prompt('Enter discount percentage (1-100):');
              if (!discount) return;
              
              const { error } = await supabase.rpc('admin_manage_promo', {
                action: 'create',
                target_code: code.toUpperCase(),
                p_discount_percent: Number(discount),
                p_max_uses: 100,
                secret_key: 'yatrago_super_admin_secret_2026'
              });
              if (error) addToast(error.message, 'error');
              else {
                addToast('Promo created', 'success');
                fetchPromoCodes();
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
                {promoCodes.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, letterSpacing: 1 }}>{p.code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-accent-green)' }}>{p.discount_percent}% OFF</td>
                    <td>{p.current_uses} / {p.max_uses}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: 'none' }}
                        onClick={async () => {
                          await supabase.rpc('admin_manage_promo', { action: 'toggle', target_code: p.code, secret_key: 'yatrago_super_admin_secret_2026' });
                          fetchPromoCodes();
                        }}>Toggle</button>
                      <button className="btn btn-sm" style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--color-accent-red)', border: 'none', marginLeft: 8 }}
                        onClick={async () => {
                          await supabase.rpc('admin_manage_promo', { action: 'delete', target_code: p.code, secret_key: 'yatrago_super_admin_secret_2026' });
                          fetchPromoCodes();
                        }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {promoCodes.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>No promo codes exist yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== SUPPORT HELP DESK ===== */}
      {activeSection === 'support' && (
        <div style={{ display: 'flex', gap: 24, height: '600px', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ width: 300, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
              Active Tickets ({conversations.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map(c => (
                <div key={c.id} 
                  onClick={() => setSelectedChatId(c.id)}
                  style={{ 
                    padding: 16, borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                    background: selectedChatId === c.id ? 'var(--color-bg-secondary)' : 'transparent'
                  }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.title || 'User Support'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date(c.created_at).toLocaleString()}</div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No active support tickets.</div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChatId ? (
              <>
                <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
                  Chat ID: {selectedChatId.slice(0,8)}...
                </div>
                <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.filter(m => m.conversation_id === selectedChatId).map(m => (
                    <div key={m.id} style={{ 
                      alignSelf: m.sender_id === currentUser?.id ? 'flex-end' : 'flex-start',
                      background: m.sender_id === currentUser?.id ? 'var(--gradient-primary)' : 'var(--color-bg-secondary)',
                      color: m.sender_id === currentUser?.id ? 'white' : 'inherit',
                      padding: '10px 14px', borderRadius: 12, maxWidth: '80%'
                    }}>
                      <div style={{ fontSize: '0.9rem' }}>{m.content}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
                  <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Type reply..." value={adminReply} onChange={e => setAdminReply(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && adminReply.trim()) {
                      sendMessage(selectedChatId, adminReply);
                      setAdminReply('');
                    }
                  }} />
                  <button className="btn btn-primary" onClick={() => {
                    if (adminReply.trim()) {
                      sendMessage(selectedChatId, adminReply);
                      setAdminReply('');
                    }
                  }}>Send</button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                Select a ticket to view conversation
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS ===== */}
      {activeSection === 'settings' && (
        <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 24 }}><Settings size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Platform Global Settings</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label className="form-label">Agent Commission Rate (%)</label>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Percentage commission rate for agents when they book tickets.</div>
              <input type="number" className="form-input" value={localSettings.agent_commission_rate || ''} onChange={e => setLocalSettings({...localSettings, agent_commission_rate: e.target.value})} />
            </div>
            
            <div>
              <label className="form-label">Owner Platform Fee (%)</label>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Percentage fee deducted from owner payouts.</div>
              <input type="number" className="form-input" value={localSettings.owner_platform_fee || ''} onChange={e => setLocalSettings({...localSettings, owner_platform_fee: e.target.value})} />
            </div>

            <div>
              <label className="form-label">Withdrawal Flat Fee (₹)</label>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Flat fee charged on wallet withdrawals.</div>
              <input type="number" className="form-input" value={localSettings.withdrawal_fee || ''} onChange={e => setLocalSettings({...localSettings, withdrawal_fee: e.target.value})} />
            </div>

            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={async () => {
              try {
                for (const [key, val] of Object.entries(localSettings)) {
                  await supabase.rpc('update_platform_setting_admin', { setting_key: key, new_value: Number(val), secret_key: 'yatrago_super_admin_secret_2026' });
                }
                addToast('Settings updated successfully!', 'success');
              } catch (e) { addToast('Error updating settings', 'error'); }
            }}>Save Changes</button>
          </div>
        </div>
      )}

    </div>
  );
}
