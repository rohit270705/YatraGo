import { useState, useEffect } from 'react';
import { Home, Plus, Edit3, Trash2, Clock, CheckCircle, XCircle, IndianRupee, MapPin, Shield } from 'lucide-react';
import { useAccommodationStore, useAuthStore, useToastStore } from '../store';

export default function HostDashboardPage() {
  const { user } = useAuthStore();
  const { createAccommodation, fetchHostAccommodations } = useAccommodationStore();
  const { addToast } = useToastStore();
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'Pay-and-Stay', destination: '', price_per_night: '',
    description: '', house_rules: '', budget_category: 'Budget'
  });

  useEffect(() => {
    if (user) {
      fetchHostAccommodations(user.id).then(data => setListings(data));
    }
  }, [user, fetchHostAccommodations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.destination || !form.price_per_night) {
      addToast('Please fill all required fields', 'warning');
      return;
    }
    setIsSubmitting(true);
    const result = await createAccommodation({
      ...form,
      price_per_night: parseFloat(form.price_per_night),
      host_id: user.id,
      status: 'pending'
    });
    if (result.success) {
      addToast('Listing submitted for admin approval!', 'success');
      setShowForm(false);
      setForm({ name: '', type: 'Pay-and-Stay', destination: '', price_per_night: '', description: '', house_rules: '', budget_category: 'Budget' });
      const updated = await fetchHostAccommodations(user.id);
      setListings(updated);
    } else {
      addToast(result.error || 'Failed to create listing', 'error');
    }
    setIsSubmitting(false);
  };

  const statusBadge = (status) => {
    const map = {
      pending: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending Approval' },
      approved: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Live' },
      rejected: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: 600 }}>
        <s.icon size={14} /> {s.label}
      </span>
    );
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Homestay Listings</h1>
          <p className="page-subtitle">List your home for travellers. Admin approval required.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> List My Home
        </button>
      </div>

      {listings.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Home size={48} /></div>
          <h3>No listings yet</h3>
          <p>Click "List My Home" to register your property as a Pay-and-Stay for travellers.</p>
        </div>
      ) : (
        <div className="route-grid" style={{ marginBottom: 32 }}>
          {listings.map(l => (
            <div key={l.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1.1rem' }}>{l.name}</h3>
                {statusBadge(l.status)}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <MapPin size={14} /> {l.destination}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <IndianRupee size={14} /> ₹{l.price_per_night}/night
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>{l.description || 'No description'}</p>
              {l.house_rules && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
                  <strong>House Rules:</strong> {l.house_rules}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Listing Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">List Your Home</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Property Name *</label>
                <input className="form-input" placeholder="e.g. Sunny Hillside Cottage" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Destination / City *</label>
                <input className="form-input" placeholder="e.g. Manali, Goa, Jaipur" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Price per Night (₹) *</label>
                  <input type="number" className="form-input" placeholder="e.g. 800" value={form.price_per_night} onChange={e => setForm({...form, price_per_night: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Category</label>
                  <select className="form-select" value={form.budget_category} onChange={e => setForm({...form, budget_category: e.target.value})}>
                    <option value="Budget">Budget</option>
                    <option value="Mid-range">Mid-range</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Stay Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="Pay-and-Stay">Pay-and-Stay (Local Homestay)</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Lounge">Lounge Stay</option>
                  <option value="Dormitory">Dormitory</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} placeholder="Describe your property, surroundings, amenities..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">House Rules</label>
                <textarea className="form-input" rows={2} placeholder="e.g. No smoking, Check-in after 2 PM..." value={form.house_rules} onChange={e => setForm({...form, house_rules: e.target.value})} />
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(27,153,139,0.06)', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Shield size={18} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Your listing will be reviewed by a YatraGo admin before it appears to travellers. You'll be notified once approved.
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
