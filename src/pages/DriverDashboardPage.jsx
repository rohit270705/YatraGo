import { useState, useEffect } from 'react';
import {
  Car, Plus, MapPin, DollarSign, Clock, CheckCircle, Target, TrendingUp, AlertTriangle, Shield
} from 'lucide-react';
import { useAuthStore, useBookingStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';

export default function DriverDashboardPage() {
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('trips');
  
  const [jobRates, setJobRates] = useState([]);
  const [newRate, setNewRate] = useState({ from: '', to: '', rate: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const myTrips = (bookings || []).filter(b => b.driver_id === user?.id);
  const completedTrips = myTrips.filter(b => b.status === 'completed');
  const upcomingTrips = myTrips.filter(b => b.status === 'confirmed' || b.status === 'in_progress');
  const totalEarnings = completedTrips.reduce((sum, b) => sum + (b.driver_fee || 0), 0);

  useEffect(() => {
    fetchRates();
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
          rate: parseFloat(newRate.rate)
        }]);
      if (error) throw error;
      
      addToast('Route rate added successfully!', 'success');
      setNewRate({ from: '', to: '', rate: '' });
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
                      <th>Rate (₹)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobRates.map(rate => (
                      <tr key={rate.id}>
                        <td>{rate.from_city}</td>
                        <td>{rate.to_city}</td>
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
    </div>
  );
}
