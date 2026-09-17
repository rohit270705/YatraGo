import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palmtree, MapPin, Calendar, Clock, Star, Filter } from 'lucide-react';
import { usePackageStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';

export default function PackagesPage() {
  const { packages, isLoading, fetchPackages } = usePackageStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const categories = ['All', 'Heritage', 'Hill Station', 'Beach', 'Spiritual', 'Wildlife/Adventure', 'Honeymoon', 'Family'];

  const filteredPackages = packages.filter(p => filter === 'All' || p.category === filter);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Holiday Packages</h1>
          <p className="page-subtitle">Curated trips for your perfect getaway</p>
        </div>
      </div>

      <div className="category-pills" style={{ marginBottom: 24 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn btn-sm pill ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 20, padding: '8px 16px', fontSize: '0.875rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="route-grid">
          <SkeletonLoader type="card" count={6} />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Palmtree size={48} /></div>
          <h3>No packages found</h3>
          <p>We couldn't find any holiday packages matching your criteria.</p>
        </div>
      ) : (
        <div className="route-grid">
          {filteredPackages.map(pkg => (
            <div key={pkg.id} className="route-card" onClick={() => navigate(`/package/${pkg.id}`)} style={{ cursor: 'pointer' }}>
              <div style={{ height: 180, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', position: 'relative', overflow: 'hidden' }}>
                {pkg.image_url ? (
                  <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Palmtree size={48} opacity={0.2} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 20, color: 'white', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  {pkg.category}
                </div>
              </div>
              
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 12 }}>{pkg.title}</h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <Clock size={16} />
                    {pkg.duration_days} Days / {pkg.duration_nights} Nights
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <MapPin size={16} />
                    {pkg.destinations?.length || 0} Places
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Starting from</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{pkg.base_price?.toLocaleString()}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
