import { useState, useEffect } from 'react';
import { Car, Users, Briefcase, CheckCircle2 } from 'lucide-react';
import { useVehicleStore } from '../store';

export default function VehicleSelector({ onSelect, selectedVehicleId }) {
  const { getActiveVehicles, fetchVehicles } = useVehicleStore();
  const [vehicles, setVehicles] = useState([]);
  
  useEffect(() => {
    fetchVehicles().then(() => {
      setVehicles(useVehicleStore.getState().getActiveVehicles());
    });
  }, [fetchVehicles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {vehicles.map(v => (
        <div 
          key={v.id} 
          onClick={() => onSelect(v)}
          style={{ 
            display: 'flex', 
            gap: 16, 
            padding: 16, 
            background: selectedVehicleId === v.id ? 'rgba(27, 153, 139, 0.08)' : 'var(--color-surface)',
            border: selectedVehicleId === v.id ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          {selectedVehicleId === v.id && (
            <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--color-primary)' }}>
              <CheckCircle2 size={20} />
            </div>
          )}
          
          <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: '#eee', flexShrink: 0 }}>
            {v.image_url ? (
              <img src={v.image_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={32} opacity={0.2} />
              </div>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>{v.name}</h4>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--color-surface-hover)', borderRadius: 12, color: 'var(--color-text-secondary)' }}>
                {v.type}
              </span>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {v.features || 'Standard features included'}
            </p>
            
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={14} /> {v.capacity || 4} Seats
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={14} /> {v.luggage_capacity_kg || 20}kg
              </div>
            </div>
          </div>
        </div>
      ))}
      {vehicles.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', border: '1px dashed var(--border-subtle)', borderRadius: 8 }}>
          No vehicles currently available.
        </div>
      )}
    </div>
  );
}
