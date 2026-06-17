import { useState } from 'react';
import { Calendar, Edit2, Search, Filter, Save, X, DollarSign, Users, MapPin, Ticket } from 'lucide-react';
import { useBookingStore, useAuthStore, useAgentStore, useToastStore } from '../store';

export default function DailyReportPage() {
  const { bookings, updatePaymentMode } = useBookingStore();
  const { user } = useAuthStore();
  const { currentAgent } = useAgentStore();
  const { addToast } = useToastStore();

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [editMode, setEditMode] = useState('cash');

  const role = user?.role || 'passenger';
  
  // Filter bookings based on role and date
  const filteredBookings = bookings.filter(b => {
    // Role filter
    if (role === 'agent') {
      if (!b.isAgentBooking) return false;
      // If we have an agent ID, match it (mock setup might not always have it perfect)
      if (currentAgent?.id && b.agentId && b.agentId !== currentAgent.id) return false;
    }
    
    // Date filter
    const bookingDate = new Date(b.createdAt || b.route?.date || new Date()).toISOString().split('T')[0];
    if (dateFilter && bookingDate !== dateFilter) return false;
    
    return true;
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const cashBookings = filteredBookings.filter(b => b.customerPaymentMode === 'cash').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const upiBookings = filteredBookings.filter(b => b.customerPaymentMode === 'upi').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const walletBookings = filteredBookings.filter(b => !b.customerPaymentMode || b.customerPaymentMode === 'wallet').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const startEdit = (booking) => {
    setEditingId(booking.id);
    setEditMode(booking.customerPaymentMode || 'wallet');
  };

  const saveEdit = (id) => {
    updatePaymentMode(id, editMode);
    addToast('Payment mode updated successfully', 'success');
    setEditingId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Daily Booking Report</h1>
        <p>Track your daily transactions, passengers, and payment modes</p>
      </div>

      {/* Filters and Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>Select Date</div>
          <input 
            type="date" 
            className="form-input" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-icon green"><DollarSign size={20} /></div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-icon teal"><DollarSign size={20} /></div>
          <div className="stat-card-label">Cash Collected</div>
          <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>₹{cashBookings.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-icon purple"><DollarSign size={20} /></div>
          <div className="stat-card-label">UPI Collected</div>
          <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>₹{upiBookings.toLocaleString()}</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-text-tertiary)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Booking ID</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Passengers</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Destination</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cost</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Payment Mode</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  No bookings found for {dateFilter}
                </td>
              </tr>
            ) : (
              filteredBookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{b.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {new Date(b.createdAt || b.route?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} color="var(--color-text-tertiary)" />
                      <span>{b.passengerDetails.length} ({b.passengerDetails[0]?.name || 'Unknown'})</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="var(--color-text-tertiary)" />
                      <span>{b.route?.from} → {b.route?.to}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    ₹{b.totalAmount}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === b.id ? (
                      <select 
                        className="form-select" 
                        value={editMode} 
                        onChange={(e) => setEditMode(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="wallet">Wallet</option>
                      </select>
                    ) : (
                      <span className={`badge ${
                        b.customerPaymentMode === 'cash' ? 'badge-success' : 
                        b.customerPaymentMode === 'upi' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {(b.customerPaymentMode || 'Wallet').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {editingId === b.id ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => saveEdit(b.id)} title="Save">
                          <Save size={14} />
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)} title="Cancel">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-secondary" onClick={() => startEdit(b)} title="Edit Payment Mode">
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
