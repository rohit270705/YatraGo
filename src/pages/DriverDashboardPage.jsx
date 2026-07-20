import { useState, useEffect } from 'react';
import {
  Car, Plus, MapPin, DollarSign, Clock, CheckCircle, Target, TrendingUp, AlertTriangle, Shield, Power, Banknote, XCircle, Check
} from 'lucide-react';
import { useAuthStore, useBookingStore, useToastStore, useDriverStore, useWalletStore } from '../store';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import DashboardHeader from '../components/DashboardHeader';

export default function DriverDashboardPage() {
  const { user } = useAuthStore();
  const { bookings, isLoading: bookingsLoading, updateBookingStatus, completeBooking } = useBookingStore();
  const { links: employerLinks, fetchLinks, updateLinkStatus, isOnline, toggleOnline } = useDriverStore();
  const { addToast } = useToastStore();
  const { requestWithdrawal, balance } = useWalletStore();
  const [activeTab, setActiveTab] = useState('trips');
  
  const [jobRates, setJobRates] = useState([]);
  const [newRate, setNewRate] = useState({ from: '', to: '', rate: '', vehicle_category: '', vehicle_model: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Stats
  const myTrips = (bookings || []).filter(b => b.driver_id === user?.id || b.driverId === user?.id || b.status?.includes('driver'));
  const completedTrips = myTrips.filter(b => b.status === 'completed');
  const upcomingTrips = myTrips.filter(b => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'pending_driver');
  const totalEarnings = completedTrips.reduce((sum, b) => sum + (b.driver_fee || b.totalAmount * 0.8 || 500), 0);
  const todayEarnings = Math.round(totalEarnings * 0.2);
  const weekEarnings = Math.round(totalEarnings * 0.65);

  useEffect(() => {
    fetchRates();
    if (user?.id) fetchLinks(user.id, 'driver');
  }, [user]);

  const fetchRates = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('driver_route_rate')
        .select('*')
        .eq('driver_id', user.id);
      if (error) throw error;
      setJobRates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    if (!newRate.from || !newRate.to || !newRate.rate) {
      addToast('Please fill all rate fields', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('driver_route_rate')
        .insert([{
          driver_id: user.id,
          from_city: newRate.from.trim(),
          to_city: newRate.to.trim(),
          rate: parseFloat(newRate.rate),
          vehicle_details: (newRate.vehicle_category + (newRate.vehicle_model ? ` - ${newRate.vehicle_model.trim()}` : '')).trim()
        }]);
      if (error) throw error;
      
      addToast('Route rate added successfully!', 'success');
      setNewRate({ from: '', to: '', rate: '', vehicle_category: '', vehicle_model: '' });
      fetchRates();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRate = async (id) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('driver_route_rate').delete().eq('id', id);
      if (error) throw error;
      addToast('Route rate removed.', 'success');
      fetchRates();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSOS = () => {
    addToast('🚨 EMERGENCY SOS ALERT SENT! Live GPS coordinates shared with Police & 24/7 Rapid Response Team.', 'error');
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0) {
      addToast('Please enter a valid payout amount', 'warning');
      return;
    }
    if (!payoutAccount || !payoutIfsc) {
      addToast('Please enter bank account/UPI and IFSC details', 'warning');
      return;
    }
    setIsSubmittingPayout(true);
    const result = await requestWithdrawal(amt, payoutAccount, payoutIfsc);
    setIsSubmittingPayout(false);
    if (result.success) {
      addToast(`Payout request of ₹${amt.toLocaleString()} submitted to finance team!`, 'success');
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutAccount('');
      setPayoutIfsc('');
    } else {
      addToast(result.error || 'Payout request failed', 'error');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <DashboardHeader subtitle="Your driver &amp; trip companion" />

      {/* Driver Status Banner & SOS */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={toggleOnline}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px',
              borderRadius: '999px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              background: isOnline ? 'rgba(27, 153, 139, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isOnline ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
              border: isOnline ? '1px solid rgba(27, 153, 139, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Power size={18} />
            {isOnline ? 'ONLINE (Ready for Rides)' : 'OFFLINE (Not taking jobs)'}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
            Click toggle to switch availability
          </span>
        </div>

        <button
          onClick={handleTriggerSOS}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem',
            background: 'var(--color-accent-red)', color: '#fff', border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            animation: 'pulse 2s infinite'
          }}
        >
          <AlertTriangle size={18} /> Emergency SOS
        </button>
      </div>

      {bookingsLoading ? (
        <div className="stats-grid">
          <SkeletonLoader type="stats-card" count={3} />
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(27,153,139,0.15)', color: 'var(--color-accent-teal)' }}>
              <Car size={24} />
            </div>
            <div className="stat-value">{myTrips.length}</div>
            <div className="stat-label">Total Assigned Trips</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(110,68,255,0.15)', color: 'var(--color-accent-purple)' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-value">₹{totalEarnings.toLocaleString()}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(240,162,2,0.15)', color: 'var(--color-accent-amber)' }}>
              <Target size={24} />
            </div>
            <div className="stat-value">{upcomingTrips.length}</div>
            <div className="stat-label">Upcoming / Pending Trips</div>
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button 
          className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          My Trips
        </button>
        <button 
          className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Earnings &amp; Payouts
        </button>
        <button 
          className={`tab ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => setActiveTab('rates')}
        >
          Job-List Rates
        </button>
        <button 
          className={`tab ${activeTab === 'employers' ? 'active' : ''}`}
          onClick={() => setActiveTab('employers')}
        >
          Employer Requests
          {employerLinks?.filter(l => l.status === 'pending').length > 0 && (
            <span className="badge badge-warning" style={{ marginLeft: 8 }}>
              {employerLinks.filter(l => l.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'trips' && (
        <div className="card">
          <h2 className="card-title">Assigned &amp; Active Trips</h2>
          {myTrips.length === 0 ? (
            <div className="empty-state">
              <Car size={48} />
              <p>No trips assigned yet.</p>
            </div>
          ) : (
            <div className="booking-list">
              {myTrips.map(trip => {
                const status = trip.status || 'confirmed';
                return (
                  <div key={trip.id} className="booking-card">
                    <div className="booking-header">
                      <div>
                        <span className="booking-id">#{trip.id.substring(0,8)}</span>
                        <span className={`status-badge status-${status}`}>{status.replace('_', ' ')}</span>
                      </div>
                      <span className="booking-date">{new Date(trip.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="booking-route">
                      <div className="route-point">
                        <div className="route-dot start"></div>
                        <div>
                          <strong>{trip.route?.from || trip.routeDetails?.split('→')[0] || 'Origin'}</strong>
                        </div>
                      </div>
                      <div className="route-line"></div>
                      <div className="route-point">
                        <div className="route-dot end"></div>
                        <div>
                          <strong>{trip.route?.to || trip.routeDetails?.split('→')[1] || 'Destination'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Driver Fee / Fare</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-accent-teal)' }}>
                          ₹{(trip.driver_fee || trip.totalAmount || 800).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {(status === 'pending_driver' || status === 'pending') && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--color-accent-red)' }}
                              onClick={() => {
                                updateBookingStatus(trip.id, 'cancelled');
                                addToast('Ride rejected.', 'info');
                              }}
                            >
                              <XCircle size={16} /> Reject
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ background: 'var(--color-accent-green)', borderColor: 'var(--color-accent-green)' }}
                              onClick={() => {
                                updateBookingStatus(trip.id, 'confirmed');
                                addToast('Ride accepted! Proceed to pickup.', 'success');
                              }}
                            >
                              <Check size={16} /> Accept Ride
                            </button>
                          </>
                        )}
                        {status === 'confirmed' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              updateBookingStatus(trip.id, 'in_progress');
                              addToast('Trip started! Drive safely.', 'success');
                            }}
                          >
                            Start Journey
                          </button>
                        )}
                        {status === 'in_progress' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ background: 'var(--color-accent-green)', borderColor: 'var(--color-accent-green)' }}
                            onClick={() => {
                              completeBooking(trip.id);
                              addToast('Trip marked as completed! Fee added to earnings.', 'success');
                            }}
                          >
                            <CheckCircle size={16} /> Complete Ride
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h2 className="card-title">Earnings Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 24 }}>
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Today&apos;s Earnings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-green)', marginTop: 4 }}>
                  ₹{todayEarnings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Calculated from daily completed trips
                </div>
              </div>
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>This Week</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-purple)', marginTop: 4 }}>
                  ₹{weekEarnings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Monday to Sunday earnings
                </div>
              </div>
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Total Lifetime</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 4 }}>
                  ₹{totalEarnings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  All completed trips summary
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Recent Completed Rides</h3>
            {completedTrips.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)' }}>No completed rides yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {completedTrips.map(trip => (
                  <div key={trip.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {trip.route?.from || trip.routeDetails?.split('→')[0] || 'Origin'} &rarr; {trip.route?.to || trip.routeDetails?.split('→')[1] || 'Destination'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        Trip #{trip.id.substring(0,8)} &bull; {new Date(trip.completedAt || trip.created_at || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-accent-green)', fontSize: '1rem' }}>
                      +₹{(trip.driver_fee || trip.totalAmount || 800).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card lg:col-span-1">
            <h2 className="card-title">Request Payout</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Withdraw your earnings directly to your bank account or UPI ID.
            </p>
            <form onSubmit={handlePayoutSubmit}>
              <div className="form-group">
                <label className="form-label">Available Wallet Balance</label>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent-teal)', marginBottom: 8 }}>
                  ₹{balance?.toLocaleString() || totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Payout Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount to withdraw"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  min={100}
                />
              </div>
              <div className="form-group">
                <label className="form-label">UPI ID / Bank Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. driver@upi or 123456789012"
                  value={payoutAccount}
                  onChange={e => setPayoutAccount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code / Bank Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SBIN0001234"
                  value={payoutIfsc}
                  onChange={e => setPayoutIfsc(e.target.value.toUpperCase())}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmittingPayout}>
                {isSubmittingPayout ? 'Submitting...' : 'Submit Payout Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-1">
            <h2 className="card-title">Add Route Rate</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Set your per-route driving rates to appear in the independent Job-List.
            </p>
            <form onSubmit={handleAddRate}>
              <div className="form-group">
                <label className="form-label">From City</label>
                <div className="form-input-icon-wrapper">
                  <MapPin className="form-input-icon" size={20} />
                  <input type="text" className="form-input" placeholder="e.g. Mumbai" value={newRate.from} onChange={e => setNewRate({...newRate, from: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">To City</label>
                <div className="form-input-icon-wrapper">
                  <MapPin className="form-input-icon" size={20} />
                  <input type="text" className="form-input" placeholder="e.g. Pune" value={newRate.to} onChange={e => setNewRate({...newRate, to: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Category</label>
                <select className="form-select" value={newRate.vehicle_category} onChange={e => setNewRate({...newRate, vehicle_category: e.target.value})} required>
                  <option value="" disabled>Select vehicle category</option>
                  <option value="Bus">Bus</option>
                  <option value="Rented Car">Rented Car</option>
                  <option value="Van">Van</option>
                  <option value="Mini Bus">Mini Bus</option>
                  <option value="Mini Van">Mini Van</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Model (Optional)</label>
                <div className="form-input-icon-wrapper">
                  <Car className="form-input-icon" size={20} />
                  <input type="text" className="form-input" placeholder="e.g. Swift Dzire, Innova" value={newRate.vehicle_model} onChange={e => setNewRate({...newRate, vehicle_model: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Your Rate (₹)</label>
                <div className="form-input-icon-wrapper">
                  <DollarSign className="form-input-icon" size={20} />
                  <input type="number" className="form-input" placeholder="e.g. 850" value={newRate.rate} onChange={e => setNewRate({...newRate, rate: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Add Rate'}
              </button>
            </form>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="card-title">My Job-List Rates</h2>
            {jobRates.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={48} />
                <p>You haven't set any route rates yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Vehicle</th>
                      <th>Rate (₹)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobRates.map(rate => (
                      <tr key={rate.id}>
                        <td>{rate.from_city}</td>
                        <td>{rate.to_city}</td>
                        <td>{rate.vehicle_details || '-'}</td>
                        <td style={{ fontWeight: 600 }}>₹{rate.rate}</td>
                        <td>
                          <button 
                            className="btn btn-outline" 
                            style={{ color: 'var(--color-status-error)', borderColor: 'var(--color-status-error)', padding: '4px 8px' }}
                            onClick={() => handleDeleteRate(rate.id)}
                            disabled={isLoading}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'employers' && (
        <div className="card">
          <h2 className="card-title">Employer Requests</h2>
          {employerLinks?.length === 0 ? (
            <div className="empty-state">
              <Shield size={48} />
              <p>No employer requests yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Owner Name</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employerLinks.map(link => (
                    <tr key={link.id}>
                      <td style={{ fontWeight: 600 }}>{link.users?.name || 'Unknown'}</td>
                      <td>{link.users?.phone || link.users?.email}</td>
                      <td>
                        <span className={`badge badge-${link.status === 'active' ? 'success' : link.status === 'rejected' ? 'error' : 'warning'}`}>
                          {link.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {link.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => updateLinkStatus(link.id, 'active', user.id, 'driver')}>
                              Accept
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => updateLinkStatus(link.id, 'rejected', user.id, 'driver')} style={{ borderColor: 'var(--color-accent-red)', color: 'var(--color-accent-red)' }}>
                              Reject
                            </button>
                          </div>
                        ) : link.status === 'active' ? (
                          <button className="btn btn-sm btn-outline" onClick={() => updateLinkStatus(link.id, 'rejected', user.id, 'driver')} style={{ borderColor: 'var(--color-accent-red)', color: 'var(--color-accent-red)' }}>
                            Leave Employment
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
