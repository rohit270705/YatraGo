import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Wallet, Sparkles, Map, MoreHorizontal, Share2 } from 'lucide-react';
import DayTimeline from '../components/DayTimeline';
import DestinationGuide from '../components/DestinationGuide';
import DashboardHeader from '../components/DashboardHeader';
import { useTripGraphStore, useWalletStore, useAuthStore, useToastStore, useChatStore } from '../store';

const NODE_TYPES = [
  { type: 'vehicle',   emoji: '🚗', label: 'Vehicle / Cab' },
  { type: 'stay',      emoji: '🏠', label: 'Homestay / Hotel' },
  { type: 'food',      emoji: '🍛', label: 'Food Stop' },
  { type: 'parcel',    emoji: '📦', label: 'Parcel Drop' },
  { type: 'activity',  emoji: '🎯', label: 'Activity' },
  { type: 'transport', emoji: '🚌', label: 'Bus / Ferry' },
];

export default function TripGraphPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const addToast = useToastStore(s => s.addToast);
  const { toggleChat, sendUserMessage } = useChatStore();

  const {
    activeTrip,
    loadTrip,
    createTrip,
    addNode,
    updateNodeStatus,
    isLoading,
  } = useTripGraphStore();

  const [activeDay, setActiveDay] = useState(1);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ title: '', budget: '', days: 3, startDate: '', destination: '' });
  const [newNode, setNewNode] = useState({
    node_type: 'vehicle',
    title: '',
    location: '',
    start_time: '',
    estimated_cost: '',
    notes: '',
  });

  const isPassenger = user?.role === 'passenger';
  const isAgent = user?.role === 'agent';
  const isDriver = user?.role === 'driver';
  const readOnly = isDriver;

  useEffect(() => {
    if (tripId && tripId !== 'new') {
      loadTrip(tripId);
    } else {
      setShowNewTrip(true);
    }
  }, [tripId, loadTrip]);

  // Build days array from activeTrip
  const days = activeTrip ? buildDays(activeTrip) : [];
  const totalEstimatedCost = (activeTrip?.nodes || []).reduce((s, n) => s + (n.estimated_cost || 0), 0);
  const shortfall = totalEstimatedCost > balance ? totalEstimatedCost - balance : 0;

  function buildDays(trip) {
    const numDays = trip.total_days || 1;
    const nodes = trip.nodes || [];
    return Array.from({ length: numDays }, (_, i) => {
      const dayNodes = nodes.filter(n => n.day_number === i + 1).sort((a, b) => a.order_index - b.order_index);
      const totalCost = dayNodes.reduce((s, n) => s + (n.estimated_cost || 0), 0);
      const startDate = trip.start_date ? new Date(new Date(trip.start_date).getTime() + i * 86400000).toISOString().split('T')[0] : '';
      return { dayNumber: i + 1, date: startDate, nodes: dayNodes, totalCost };
    });
  }

  const handleCreateTrip = async () => {
    if (!newTrip.title.trim()) { addToast('Please enter a trip title', 'error'); return; }
    const result = await createTrip({
      title: newTrip.title,
      budget: Number(newTrip.budget) || 0,
      total_days: Number(newTrip.days) || 3,
      start_date: newTrip.startDate,
      destination: newTrip.destination,
    });
    if (result.success) {
      setShowNewTrip(false);
      addToast(`Trip "${newTrip.title}" created! 🗺️`, 'success');
      if (result.trip?.id) navigate(`/trip/${result.trip.id}`, { replace: true });
    } else {
      addToast('Failed to create trip. Try again.', 'error');
    }
  };

  const handleAddNode = async () => {
    if (!newNode.title.trim()) { addToast('Please enter a stop title', 'error'); return; }
    const result = await addNode({
      trip_graph_id: activeTrip.id,
      day_number: activeDay,
      order_index: (days.find(d => d.dayNumber === activeDay)?.nodes.length || 0) + 1,
      node_type: newNode.node_type,
      title: newNode.title,
      location: newNode.location,
      start_time: newNode.start_time || null,
      estimated_cost: Number(newNode.estimated_cost) || 0,
      notes: newNode.notes,
      status: 'planned',
    });
    if (result.success) {
      setShowAddNode(false);
      setNewNode({ node_type: 'vehicle', title: '', location: '', start_time: '', estimated_cost: '', notes: '' });
      addToast('Stop added! 📍', 'success');
    }
  };

  const handleNodeAction = (node) => {
    // Mark as booked and redirect to appropriate page
    updateNodeStatus(node.id, 'booked');
    const routes = {
      vehicle: `/search`,
      stay: '/host',
      food: '/search?type=food',
      parcel: '/parcel',
      activity: '/search',
      transport: '/search',
    };
    navigate(routes[node.node_type] || '/search');
  };

  const handleYaaraPlanning = () => {
    toggleChat();
    setTimeout(() => {
      sendUserMessage(`Plan me ${activeTrip?.total_days || 3} days for my trip "${activeTrip?.title || 'upcoming trip'}". Budget is ₹${activeTrip?.budget || 15000}.`);
    }, 400);
  };

  // ── New Trip modal ──
  if (showNewTrip) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader subtitle="Create your trip graph" />
        <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🗺️ Plan a New Trip</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
              Create a live trip graph — add vehicle, stay, food, and parcel stops, all in one place.
            </div>
            <div className="form-group">
              <label className="form-label">Destination</label>
              <select className="form-input" value={newTrip.destination} 
                onChange={e => setNewTrip(p => ({ 
                  ...p, 
                  destination: e.target.value, 
                  title: e.target.value ? `Trip to ${e.target.options[e.target.selectedIndex].text.split(' ')[0]}` : p.title 
                }))}>
                <option value="">Select Destination...</option>
                <option value="jaipur">Jaipur (Pink City)</option>
                <option value="goa">Goa (Party Capital)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trip Name *</label>
              <input className="form-input" placeholder="e.g. Goa Getaway 2026" value={newTrip.title}
                onChange={e => setNewTrip(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Number of Days</label>
                <input className="form-input" type="number" min={1} max={30} value={newTrip.days}
                  onChange={e => setNewTrip(p => ({ ...p, days: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Budget (₹)</label>
                <input className="form-input" type="number" placeholder="15000" value={newTrip.budget}
                  onChange={e => setNewTrip(p => ({ ...p, budget: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={newTrip.startDate}
                onChange={e => setNewTrip(p => ({ ...p, startDate: e.target.value }))} style={{ colorScheme: 'dark' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateTrip}>
                <Map size={16} /> Create Trip
              </button>
              <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !activeTrip) {
    return (
      <div className="animate-fade-in" style={{ padding: 24, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🗺️</div>
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading your trip...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <DashboardHeader subtitle={`Trip Graph — ${user?.name || 'Traveller'}`} />

      {/* Trip header */}
      <div className="trip-page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="trip-page-title">{activeTrip.title}</div>
        {activeTrip.budget > 0 && (
          <div className="trip-page-budget">
            💰 Budget: ₹{Number(activeTrip.budget).toLocaleString('en-IN')}
          </div>
        )}
        <button className="btn btn-ghost btn-sm" title="Share trip">
          <Share2 size={16} />
        </button>
      </div>

      {/* Wallet bar */}
      {!readOnly && (
        <div className="trip-wallet-bar animate-slide-up stagger-1">
          <div className="trip-wallet-bar-stat">
            <span className="trip-wallet-bar-label">Estimated Total</span>
            <span className="trip-wallet-bar-value">₹{totalEstimatedCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="trip-wallet-bar-stat">
            <span className="trip-wallet-bar-label">Wallet Balance</span>
            <span className={`trip-wallet-bar-value${shortfall > 0 ? ' shortfall' : ''}`}>
              ₹{Number(balance).toLocaleString('en-IN')}
            </span>
          </div>
          {shortfall > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-accent-coral)' }}>
                ⚠️ ₹{shortfall.toLocaleString('en-IN')} shortfall
              </span>
              <button className="trip-topup-btn" onClick={() => navigate('/wallet')}>
                <Wallet size={13} style={{ display: 'inline', marginRight: 4 }} />
                Top Up
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-accent-green)', fontWeight: 600 }}>
              ✅ Wallet covers the trip
            </div>
          )}
        </div>
      )}

      {/* Yaara planning banner */}
      {!readOnly && days.every(d => d.nodes.length === 0) && (
        <div className="yaara-plan-banner animate-slide-up stagger-2">
          <div className="yaara-plan-icon">✨</div>
          <div className="yaara-plan-text">
            <div className="yaara-plan-title">Let Yaara plan this trip for you</div>
            <div className="yaara-plan-sub">
              Tell Yaara your budget and preferences — she'll populate this graph with real vehicles, stays, and activities from YatraGo.
            </div>
          </div>
          <button className="yaara-plan-btn" onClick={handleYaaraPlanning}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: 5 }} />
            Ask Yaara
          </button>
        </div>
      )}

      {/* Day Timeline */}
      <div className="animate-slide-up stagger-3">
        <DayTimeline
          days={days}
          activeDay={activeDay}
          onDaySelect={setActiveDay}
          onAddNode={() => setShowAddNode(true)}
          onNodeAction={handleNodeAction}
          readOnly={readOnly}
        />
      </div>

      {/* Add Node modal */}
      {showAddNode && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 400, padding: 16,
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 16 }}>
              📍 Add Stop — Day {activeDay}
            </div>

            {/* Node type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
              {NODE_TYPES.map(nt => (
                <button
                  key={nt.type}
                  onClick={() => setNewNode(p => ({ ...p, node_type: nt.type }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 6px', border: '1px solid',
                    borderColor: newNode.node_type === nt.type ? 'var(--color-accent-teal)' : 'var(--glass-border)',
                    background: newNode.node_type === nt.type ? 'rgba(27,153,139,0.1)' : 'none',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{nt.emoji}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{nt.label}</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Stop Title *</label>
              <input className="form-input" placeholder="e.g. Pickup from Pune Station" value={newNode.title}
                onChange={e => setNewNode(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="e.g. Pune, Maharashtra" value={newNode.location}
                onChange={e => setNewNode(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input className="form-input" type="time" value={newNode.start_time}
                  onChange={e => setNewNode(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Est. Cost (₹)</label>
                <input className="form-input" type="number" placeholder="2000" value={newNode.estimated_cost}
                  onChange={e => setNewNode(p => ({ ...p, estimated_cost: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Any special notes..." value={newNode.notes}
                onChange={e => setNewNode(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddNode}>
                <Plus size={16} /> Add Stop
              </button>
              <button className="btn btn-ghost" onClick={() => setShowAddNode(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
