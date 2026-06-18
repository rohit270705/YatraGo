import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, TrendingUp, Users, Search, Percent,
  ArrowRight, DollarSign, Calendar, Clock, Paintbrush, X, Image,
  Type, Palette, Phone, Mail, MapPin, Globe, Save, Eye, EyeOff,
  Upload, Sparkles, ChevronDown
} from 'lucide-react';
import { useAgentStore, useBookingStore, useToastStore, useAuthStore } from '../store';

const GRADIENT_PRESETS = [
  { id: 'ocean', name: 'Ocean', gradient: 'linear-gradient(135deg, #0c3547 0%, #1b6b93 50%, #1bb5c0 100%)' },
  { id: 'sunset', name: 'Sunset', gradient: 'linear-gradient(135deg, #2d1b69 0%, #c0392b 50%, #f39c12 100%)' },
  { id: 'forest', name: 'Forest', gradient: 'linear-gradient(135deg, #0d3321 0%, #0f5132 50%, #198754 100%)' },
  { id: 'midnight', name: 'Midnight', gradient: 'linear-gradient(135deg, #0a0e27 0%, #1a1a4e 50%, #3d3d93 100%)' },
  { id: 'rose', name: 'Rose Gold', gradient: 'linear-gradient(135deg, #3d1f2f 0%, #8b3a62 50%, #e0a5c0 100%)' },
  { id: 'royal', name: 'Royal', gradient: 'linear-gradient(135deg, #1a0533 0%, #4a0e78 50%, #7b2ff7 100%)' },
  { id: 'ember', name: 'Ember', gradient: 'linear-gradient(135deg, #1a0a00 0%, #8b2c0d 50%, #ff6b35 100%)' },
  { id: 'arctic', name: 'Arctic', gradient: 'linear-gradient(135deg, #0b1a2c 0%, #1c4966 50%, #00b4d8 100%)' },
];

const PATTERN_PRESETS = [
  { id: 'none', name: 'None', style: {} },
  { id: 'dots', name: 'Dots', style: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '20px 20px' } },
  { id: 'grid', name: 'Grid', style: { backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '30px 30px' } },
  { id: 'diagonal', name: 'Diagonal', style: { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)' } },
  { id: 'waves', name: 'Waves', style: { backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.04) 40px, rgba(255,255,255,0.04) 41px)' } },
];

const DEFAULT_BANNER = {
  agencyName: 'Travels Express Agency',
  tagline: 'Your Trusted Travel Partner Since 2020',
  phone: '+91 99887 76655',
  email: 'booking@travelexpress.com',
  website: 'www.travelexpress.com',
  location: 'Mumbai, Maharashtra',
  gradientId: 'ocean',
  patternId: 'dots',
  logoEmoji: '✈️',
  showPhone: true,
  showEmail: true,
  showWebsite: true,
  showLocation: true,
  showStats: true,
  bannerHeight: 'normal', // compact, normal, tall
};

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const { currentAgent } = useAgentStore();
  const { bookings } = useBookingStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const agentBookings = bookings.filter(b => b.isAgentBooking);
  const totalCommission = agentBookings.reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

  // Initialize banner with user's profile details
  const initialBanner = {
    ...DEFAULT_BANNER,
    agencyName: user?.name || DEFAULT_BANNER.agencyName,
    phone: user?.phone || DEFAULT_BANNER.phone,
    email: user?.email || DEFAULT_BANNER.email,
    location: user?.address || DEFAULT_BANNER.location,
  };

  // Banner state
  const [banner, setBanner] = useState(initialBanner);
  const [isEditing, setIsEditing] = useState(false);
  const [editBanner, setEditBanner] = useState(initialBanner);
  const [activeEditTab, setActiveEditTab] = useState('content'); // content | style | visibility

  const openEditor = () => {
    setEditBanner({ ...banner });
    setIsEditing(true);
    setActiveEditTab('content');
  };

  const saveBanner = () => {
    setBanner({ ...editBanner });
    setIsEditing(false);
    addToast('Banner customized successfully! 🎨', 'success');
  };

  const resetBanner = () => {
    setEditBanner({ ...DEFAULT_BANNER });
  };

  const currentGradient = GRADIENT_PRESETS.find(g => g.id === banner.gradientId) || GRADIENT_PRESETS[0];
  const currentPattern = PATTERN_PRESETS.find(p => p.id === banner.patternId) || PATTERN_PRESETS[0];
  const editGradient = GRADIENT_PRESETS.find(g => g.id === editBanner.gradientId) || GRADIENT_PRESETS[0];
  const editPattern = PATTERN_PRESETS.find(p => p.id === editBanner.patternId) || PATTERN_PRESETS[0];

  const bannerPadding = banner.bannerHeight === 'compact' ? '28px 32px' : banner.bannerHeight === 'tall' ? '48px 32px' : '36px 32px';

  return (
    <div className="animate-fade-in">
      {/* ===== CUSTOMIZABLE BANNER ===== */}
      <div style={{
        background: currentGradient.gradient,
        borderRadius: 'var(--radius-xl)',
        padding: bannerPadding,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 400ms ease',
      }}>
        {/* Pattern Overlay */}
        <div style={{
          ...currentPattern.style,
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          pointerEvents: 'none',
        }} />

        {/* Decorative Glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '30%',
          width: 300, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
          pointerEvents: 'none',
        }} />

        {/* Customize Button */}
        <button className="btn btn-ghost btn-sm" onClick={openEditor}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem',
            zIndex: 2,
          }}>
          <Paintbrush size={13} /> Customize
        </button>

        {/* Banner Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 'var(--radius-lg)',
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}>
              {banner.logoEmoji}
            </div>
            <div>
              <h2 style={{
                fontWeight: 800, fontSize: '1.5rem', color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)', lineHeight: 1.2,
              }}>
                {banner.agencyName}
              </h2>
              <p style={{
                fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)',
                marginTop: 2,
              }}>
                {banner.tagline}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 14,
            fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)',
          }}>
            {banner.showPhone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone size={12} /> {banner.phone}
              </span>
            )}
            {banner.showEmail && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Mail size={12} /> {banner.email}
              </span>
            )}
            {banner.showWebsite && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Globe size={12} /> {banner.website}
              </span>
            )}
            {banner.showLocation && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={12} /> {banner.location}
              </span>
            )}
          </div>

          {/* Inline Stats */}
          {banner.showStats && (
            <div style={{
              display: 'flex', gap: 16, marginTop: 16,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Total Bookings', value: (currentAgent?.totalBookings || 47) + agentBookings.length },
                { label: 'Commission Earned', value: `₹${((currentAgent?.totalEarnings || 12500) + totalCommission).toLocaleString()}` },
                { label: 'Commission Rate', value: '5%' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)',
                  borderRadius: 'var(--radius-md)', padding: '10px 18px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  minWidth: 120,
                }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/search')}>
          <Search size={16} /> Book for Customer
        </button>
        <button className="btn btn-secondary" onClick={openEditor}>
          <Paintbrush size={16} /> Edit Banner
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger-children">
        <div className="stat-card">
          <div className="stat-card-icon amber"><Ticket size={22} /></div>
          <div className="stat-card-label">Total Bookings</div>
          <div className="stat-card-value">{(currentAgent?.totalBookings || 47) + agentBookings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><TrendingUp size={22} /></div>
          <div className="stat-card-label">Total Commission</div>
          <div className="stat-card-value">₹{((currentAgent?.totalEarnings || 12500) + totalCommission).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><Percent size={22} /></div>
          <div className="stat-card-label">Commission Rate</div>
          <div className="stat-card-value">5%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><Users size={22} /></div>
          <div className="stat-card-label">Customers Served</div>
          <div className="stat-card-value">{(currentAgent?.totalBookings || 47) + agentBookings.length}</div>
        </div>
      </div>

      {/* How Commission Works */}
      <div className="glass-card" style={{ marginBottom: 24, marginTop: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
          <Percent size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          How Commission Works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎫</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Book Ticket</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>On behalf of customer</div>
          </div>
          <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>5% Auto-Deducted</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>From ticket amount</div>
          </div>
          <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>💰</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Earn Commission</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Credited to your wallet</div>
          </div>
        </div>
      </div>

      {/* Recent Agent Bookings */}
      <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Agent Bookings</h3>
      {agentBookings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎫</div>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>No agent bookings yet</h4>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginBottom: 16 }}>
            Start booking tickets for your customers to earn commission.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>
            Book for Customer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agentBookings.map(booking => (
            <div key={booking.id} className="glass-card" style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'rgba(244, 162, 97, 0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ticket size={18} color="var(--color-accent-amber)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {booking.route.from} → {booking.route.to}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {booking.passengerDetails.name} • {booking.route.date}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>₹{booking.totalAmount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-amber)' }}>
                    Commission: ₹{booking.commissionAmount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== BANNER EDITOR MODAL ===== */}
      {isEditing && (
        <div className="modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Paintbrush size={18} /> Customize Banner</h3>
              <button className="modal-close" onClick={() => setIsEditing(false)}><X size={18} /></button>
            </div>

            {/* Live Preview */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Live Preview
              </div>
              <div style={{
                background: editGradient.gradient,
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                position: 'relative', overflow: 'hidden',
                transition: 'all 300ms ease',
              }}>
                <div style={{ ...editPattern.style, position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.12)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                      {editBanner.logoEmoji}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>{editBanner.agencyName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{editBanner.tagline}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                    {editBanner.showPhone && <span><Phone size={10} /> {editBanner.phone}</span>}
                    {editBanner.showEmail && <span><Mail size={10} /> {editBanner.email}</span>}
                    {editBanner.showLocation && <span><MapPin size={10} /> {editBanner.location}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Tabs */}
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab ${activeEditTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('content')}>
                <Type size={14} /> Content
              </button>
              <button className={`tab ${activeEditTab === 'style' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('style')}>
                <Palette size={14} /> Style
              </button>
              <button className={`tab ${activeEditTab === 'visibility' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('visibility')}>
                <Eye size={14} /> Visibility
              </button>
            </div>

            {/* Content Tab */}
            {activeEditTab === 'content' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Agency Name</label>
                  <input className="form-input" value={editBanner.agencyName}
                    onChange={e => setEditBanner(b => ({ ...b, agencyName: e.target.value }))}
                    placeholder="Your agency name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tagline / Slogan</label>
                  <input className="form-input" value={editBanner.tagline}
                    onChange={e => setEditBanner(b => ({ ...b, tagline: e.target.value }))}
                    placeholder="Your catchy tagline" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={editBanner.phone}
                      onChange={e => setEditBanner(b => ({ ...b, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={editBanner.email}
                      onChange={e => setEditBanner(b => ({ ...b, email: e.target.value }))}
                      placeholder="email@agency.com" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-input" value={editBanner.website}
                      onChange={e => setEditBanner(b => ({ ...b, website: e.target.value }))}
                      placeholder="www.youragency.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={editBanner.location}
                      onChange={e => setEditBanner(b => ({ ...b, location: e.target.value }))}
                      placeholder="City, State" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Logo Emoji</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['✈️', '🚌', '🏖️', '🌍', '🗺️', '🧳', '💼', '🚗', '🏔️', '⭐', '🌴', '🎯'].map(emoji => (
                      <button key={emoji}
                        className={`btn btn-sm ${editBanner.logoEmoji === emoji ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setEditBanner(b => ({ ...b, logoEmoji: emoji }))}
                        style={{ fontSize: '1.25rem', width: 44, height: 44 }}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Style Tab */}
            {activeEditTab === 'style' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Background Theme</label>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
                  }}>
                    {GRADIENT_PRESETS.map(g => (
                      <button key={g.id} onClick={() => setEditBanner(b => ({ ...b, gradientId: g.id }))}
                        style={{
                          background: g.gradient, border: editBanner.gradientId === g.id
                            ? '2px solid white' : '2px solid transparent',
                          borderRadius: 'var(--radius-md)', height: 56,
                          cursor: 'pointer', transition: 'all 200ms',
                          display: 'flex', alignItems: 'flex-end', padding: 6,
                          position: 'relative', overflow: 'hidden',
                        }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                          background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4,
                        }}>{g.name}</span>
                        {editBanner.gradientId === g.id && (
                          <div style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'white', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '0.6rem' }}>✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pattern Overlay</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PATTERN_PRESETS.map(p => (
                      <button key={p.id}
                        className={`btn btn-sm ${editBanner.patternId === p.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setEditBanner(b => ({ ...b, patternId: p.id }))}
                        style={{ fontSize: '0.8rem' }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Banner Height</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'compact', label: 'Compact' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'tall', label: 'Tall' },
                    ].map(h => (
                      <button key={h.id}
                        className={`btn btn-sm ${editBanner.bannerHeight === h.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setEditBanner(b => ({ ...b, bannerHeight: h.id }))}
                        style={{ flex: 1 }}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Visibility Tab */}
            {activeEditTab === 'visibility' && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
                  Choose what information to display on your banner.
                </p>
                {[
                  { key: 'showPhone', label: 'Phone Number', icon: Phone },
                  { key: 'showEmail', label: 'Email Address', icon: Mail },
                  { key: 'showWebsite', label: 'Website', icon: Globe },
                  { key: 'showLocation', label: 'Location', icon: MapPin },
                  { key: 'showStats', label: 'Stats Overview', icon: TrendingUp },
                ].map(item => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)', marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <item.icon size={16} color="var(--color-text-tertiary)" />
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</span>
                    </div>
                    <button
                      onClick={() => setEditBanner(b => ({ ...b, [item.key]: !b[item.key] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: editBanner[item.key] ? 'var(--color-accent-teal)' : 'var(--color-surface-elevated)',
                        border: 'none', cursor: 'pointer', position: 'relative',
                        transition: 'all 200ms ease',
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'white', position: 'absolute', top: 3,
                        left: editBanner[item.key] ? 23 : 3,
                        transition: 'left 200ms ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={resetBanner} style={{ marginRight: 'auto' }}>
                Reset to Default
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBanner}>
                <Save size={16} /> Save Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
