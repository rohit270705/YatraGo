import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Star, Info, Check, X, Car, Home, IndianRupee, Building2 } from 'lucide-react';
import { usePackageStore, useAuthStore, useToastStore, useAccommodationStore } from '../store';
import VehicleSelector from '../components/VehicleSelector';
import FoodDiscovery from '../components/FoodDiscovery';
import ReviewSection from '../components/ReviewSection';

export default function PackageDetailsPage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { packages, fetchPackages } = usePackageStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [pkg, setPkg] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [includeStay, setIncludeStay] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const { accommodations, fetchAccommodations } = useAccommodationStore();

  useEffect(() => {
    if (packages.length === 0) fetchPackages();
  }, [packages.length, fetchPackages]);

  useEffect(() => {
    const found = packages.find(p => p.id === packageId);
    if (found) setPkg(found);
  }, [packages, packageId]);

  if (!pkg) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const handleBook = () => {
    if (!user) {
      addToast('Please login to book this package', 'info');
      navigate('/login');
      return;
    }
    // Final checkout logic connecting package, vehicle, accommodation
    addToast('Booking checkout initiated!', 'success');
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: 100 }}>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to Packages
      </button>

      {/* Hero Section */}
      <div style={{ height: 300, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontSize: '2rem', opacity: 0.2 }}>{pkg.title}</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '40px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'var(--color-primary)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{pkg.category}</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: 8 }}>{pkg.title}</h1>
          <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={16} /> {pkg.duration_days}D / {pkg.duration_nights}N</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={16} /> {pkg.destinations?.join(', ')}</div>
          </div>
        </div>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
            {['itinerary', 'inclusions', 'food'].map(tab => (
              <button key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '12px 0', 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'itinerary' && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20 }}>Day by Day Itinerary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(pkg.itinerary || []).map((day, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>
                        {day.day}
                      </div>
                      {idx < pkg.itinerary.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-subtle)', margin: '8px 0' }}></div>}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{day.title}</h4>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{day.description}</p>
                    </div>
                  </div>
                ))}
                {(!pkg.itinerary || pkg.itinerary.length === 0) && (
                  <p style={{ color: 'var(--color-text-tertiary)' }}>Detailed itinerary coming soon.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inclusions' && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>What's Included</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}>
                {(pkg.inclusions || []).map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
                    <Check size={18} color="var(--color-accent-green)" /> {item}
                  </li>
                ))}
              </ul>
              
              <h3 style={{ marginBottom: 16 }}>What's Excluded</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(pkg.exclusions || []).map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
                    <X size={18} color="var(--color-accent-red)" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {activeTab === 'food' && (
            <FoodDiscovery destination={pkg.destinations?.[0]} />
          )}

          <ReviewSection targetType="package" targetId={pkg.id} />
        </div>

        {/* Customization & Booking Panel */}
        <div>
          <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 80 }}>
            <h4 style={{ marginBottom: 16, fontSize: '1rem' }}>Customize Trip</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" style={{ marginTop: 4 }} checked={true} readOnly />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Car size={16} /> Vehicle Selection</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Choose your preferred vehicle type.</div>
                  <div style={{ marginTop: 12 }}>
                    <VehicleSelector onSelect={v => setSelectedVehicle(v)} selectedVehicleId={selectedVehicle?.id} />
                  </div>
                </div>
              </label>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <input type="checkbox" style={{ marginTop: 4 }} checked={includeStay} onChange={(e) => { setIncludeStay(e.target.checked); if (e.target.checked && pkg.destinations?.[0]) fetchAccommodations(pkg.destinations[0]); }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Home size={16} /> Include Accommodation</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Add a hotel or Pay-and-Stay local homestay.</div>
                  {includeStay && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {accommodations.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-tertiary)', border: '1px dashed var(--border-subtle)', borderRadius: 8, fontSize: '0.85rem' }}>
                          No approved stays found for this destination yet.
                        </div>
                      ) : accommodations.map(acc => (
                        <div key={acc.id} onClick={() => setSelectedAccommodation(acc)}
                          style={{
                            padding: 14, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            background: selectedAccommodation?.id === acc.id ? 'rgba(27,153,139,0.08)' : 'var(--color-surface)',
                            border: selectedAccommodation?.id === acc.id ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{acc.name}</h4>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'var(--color-surface-hover)' }}>{acc.type}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IndianRupee size={12} /> ₹{acc.price_per_night}/night</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} /> {acc.budget_category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== TRANSPARENT PRICING BREAKDOWN ===== */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 20 }}>
              <h4 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Price Breakdown</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Base Package</span>
                  <span>₹{(pkg.base_price || 0).toLocaleString()}</span>
                </div>
                {selectedVehicle && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Vehicle ({selectedVehicle.vehicle_category || selectedVehicle.type || 'Bus'})</span>
                    <span>₹{(selectedVehicle.price || selectedVehicle.fare || 0).toLocaleString()}</span>
                  </div>
                )}
                {includeStay && selectedAccommodation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Stay ({selectedAccommodation.name}) × {pkg.duration_nights}N</span>
                    <span>₹{((selectedAccommodation.price_per_night || 0) * (pkg.duration_nights || 1)).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>
                    ₹{(
                      (pkg.base_price || 0) +
                      (selectedVehicle ? (selectedVehicle.price || selectedVehicle.fare || 0) : 0) +
                      (includeStay && selectedAccommodation ? (selectedAccommodation.price_per_night || 0) * (pkg.duration_nights || 1) : 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== CANCELLATION POLICY ===== */}
            <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, marginBottom: 20, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text)' }}>✅ Fair Cancellation Policy</div>
              <div>• <strong>Transport:</strong> ₹30 deduction only if cancelled within 24hrs of departure</div>
              <div>• <strong>Stay & food:</strong> Fully refundable on cancellation</div>
              <div>• <strong>All other cases:</strong> 100% refund, no questions asked</div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '16px 0', fontSize: '1.1rem' }} onClick={handleBook}>
              Continue to Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
