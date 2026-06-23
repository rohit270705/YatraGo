import { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, Users, Car, Ticket, Wallet, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, Eye, Ban, DollarSign, FileCheck, BarChart3,
  Bike, UserCheck, UserX, Clock, Search, MapPin, Star, Zap, Filter
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useVehicleStore, useBookingStore, useWalletStore, useToastStore, useRentalStore } from '../store';

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
  const { transactions } = useWalletStore();
  const { rentalVehicles, activeRentals } = useRentalStore();
  const { addToast } = useToastStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [vehicleTabFilter, setVehicleTabFilter] = useState('all');

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="badge badge-success" style={{ fontSize: '0.6rem' }}><UserCheck size={10} /> Active</span>;
      case 'inactive': return <span className="badge badge-secondary" style={{ fontSize: '0.6rem' }}><UserX size={10} /> Inactive</span>;
      case 'suspended': return <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}><Ban size={10} /> Suspended</span>;
      default: return <span className="badge">{status}</span>;
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
                    <td>{getStatusBadge(user.status)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      <Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 3 }} />
                      {user.lastActive}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{user.joinDate}</td>
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
                        { name: 'PUC Certificate', num: vehicle.puc?.number, expiry: vehicle.puc?.validUntil },
                        { name: 'Driving License', num: vehicle.driverLicense?.number, expiry: vehicle.driverLicense?.validUntil },
                        { name: 'Insurance', num: vehicle.insurance?.number, expiry: vehicle.insurance?.validUntil },
                      ].map((doc, i) => (
                        <div key={i} className="doc-status-item">
                          <div className="doc-icon" style={{ background: 'rgba(27, 153, 139, 0.12)', color: 'var(--color-accent-teal-light)' }}>
                            <FileCheck size={18} />
                          </div>
                          <div>
                            <div className="doc-name">{doc.name}</div>
                            <div className="doc-expiry">{doc.num || 'N/A'} • Exp: {doc.expiry || 'N/A'}</div>
                          </div>
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
    </div>
  );
}
