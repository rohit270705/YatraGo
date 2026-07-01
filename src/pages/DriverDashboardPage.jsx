import { useState, useEffect } from 'react';
import {
  Car, Plus, MapPin, DollarSign, Clock, CheckCircle, Target, TrendingUp, AlertTriangle, Shield
} from 'lucide-react';
import { useAuthStore, useBookingStore, useToastStore, useDriverStore } from '../store';
import { supabase } from '../supabaseClient';

export default function DriverDashboardPage() {
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const { links: employerLinks, fetchLinks, updateLinkStatus } = useDriverStore();
  const [activeTab, setActiveTab] = useState('trips');
  
  const [jobRates, setJobRates] = useState([]);
  const [newRate, setNewRate] = useState({ from: '', to: '', rate: '', vehicle_category: '', vehicle_model: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const myTrips = (bookings || []).filter(b => b.driver_id === user?.id);
  const completedTrips = myTrips.filter(b => b.status === 'completed');
  const upcomingTrips = myTrips.filter(b => b.status === 'confirmed' || b.status === 'in_progress');
  const totalEarnings = completedTrips.reduce((sum, b) => sum + (b.driver_fee || 0), 0);

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

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Driver Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
      </div>

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
          <div className="stat-label">Upcoming Trips</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button 
          className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          My Trips
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
          <h2 className="card-title">Assigned Trips</h2>
          {myTrips.length === 0 ? (
            <div className="empty-state">
              <Car size={48} />
              <p>No trips assigned yet.</p>
            </div>
          ) : (
            <div className="booking-list">
              {myTrips.map(trip => (
                <div key={trip.id} className="booking-card">
                  <div className="booking-header">
                    <div>
                      <span className="booking-id">#{trip.id.substring(0,8)}</span>
                      <span className={`status-badge status-${trip.status}`}>{trip.status.replace('_', ' ')}</span>
                    </div>
                    <span className="booking-date">{new Date(trip.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="booking-route">
                    <div className="route-point">
                      <div className="route-dot start"></div>
                      <div>
                        <strong>{trip.route?.from || 'Unknown'}</strong>
                      </div>
                    </div>
                    <div className="route-line"></div>
                    <div className="route-point">
                      <div className="route-dot end"></div>
                      <div>
                        <strong>{trip.route?.to || 'Unknown'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="card">
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

          <div className="card">
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
