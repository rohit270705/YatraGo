import { useState, useEffect, useCallback } from 'react';
import { Navigation, MapPin, Clock, Car, Phone, RefreshCw } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useVehicleStore, useBookingStore } from '../store';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'inherit'
};

export default function LiveTrackingPage() {
  const { vehicles } = useVehicleStore();
  const { bookings } = useBookingStore();
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || '');
  const [simLat, setSimLat] = useState(19.076);
  const [simLng, setSimLng] = useState(72.8777);
  const [eta, setEta] = useState('45 min');

  const vehicle = vehicles.find(v => v.id === selectedVehicle);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasValidKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasValidKey ? apiKey : 'placeholder' // prevent crash if empty, but we won't use it
  });

  // Simulate GPS movement
  useEffect(() => {
    const interval = setInterval(() => {
      setSimLat(prev => prev + (Math.random() - 0.5) * 0.002);
      setSimLng(prev => prev + (Math.random() - 0.5) * 0.002);
      const minutes = Math.floor(Math.random() * 60) + 10;
      setEta(`${minutes} min`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Live Vehicle Tracking</h1>
        <p>Track your vehicle in real-time</p>
      </div>

      {/* Vehicle Selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 250, marginBottom: 0 }}>
          <select className="form-select" value={selectedVehicle}
            onChange={e => setSelectedVehicle(e.target.value)}>
            {vehicles.filter(v => v.approved).map(v => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} — {v.type} ({v.ownerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Map */}
        <div className="map-container" style={{ height: 500, position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          {hasValidKey ? (
            isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={{ lat: simLat, lng: simLng }}
                zoom={15}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                }}
              >
                <Marker position={{ lat: simLat, lng: simLng }} />
              </GoogleMap>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)' }}>
                Loading Map...
              </div>
            )
          ) : (
            <iframe
              title="Vehicle Location"
              src={`https://maps.google.com/maps?q=${simLat},${simLng}&z=15&output=embed`}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
          <div className="map-overlay">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent-green)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Live</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              ETA: <strong style={{ color: 'var(--color-accent-teal-light)' }}>{eta}</strong>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => {
              setSimLat(prev => prev + 0.005);
              setSimLng(prev => prev + 0.003);
            }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Vehicle Info Panel */}
        <div>
          {vehicle && (
            <>
              <div className="glass-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                    background: 'rgba(27, 153, 139, 0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Car size={24} color="var(--color-accent-teal-light)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{vehicle.registrationNumber}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>{vehicle.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Driver</span>
                    <span style={{ fontWeight: 600 }}>{vehicle.ownerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Speed</span>
                    <span style={{ fontWeight: 600 }}>{Math.floor(Math.random() * 40 + 40)} km/h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Location</span>
                    <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>{simLat.toFixed(4)}, {simLng.toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Last Updated</span>
                    <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>Just now</span>
                  </div>
                </div>
              </div>

              {/* Trip Progress */}
              <div className="glass-card" style={{ marginBottom: 16 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.9375rem' }}>Trip Progress</h4>
                <div className="tracking-timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot completed"><MapPin size={14} /></div>
                    <div className="timeline-content">
                      <h4>Mumbai</h4>
                      <p>Departed at 06:00 AM</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot completed"><MapPin size={14} /></div>
                    <div className="timeline-content">
                      <h4>Lonavala</h4>
                      <p>Passed at 07:45 AM</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot active"><Navigation size={14} /></div>
                    <div className="timeline-content">
                      <h4>En Route to Khandala</h4>
                      <p>Current location • ETA: {eta}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot pending"><MapPin size={14} /></div>
                    <div className="timeline-content">
                      <h4>Pune</h4>
                      <p>Expected: 10:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-full">
                <Phone size={16} /> Call Driver
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
