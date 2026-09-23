import React, { useState } from 'react';
import { MapPin, Utensils, Activity, Users, Home, Info, Hotel, Bed, Building } from 'lucide-react';
import { destinationsData } from '../data/destinations';

export default function DestinationGuide({ destinationId }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [roamingCategory, setRoamingCategory] = useState('family');
  
  if (!destinationId || !destinationsData[destinationId]) {
    return null;
  }
  
  const data = destinationsData[destinationId];

  return (
    <div className="destination-guide" style={{ marginBottom: 32 }}>
      {/* Header */}
      <div className="destination-header" style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${data.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '32px 24px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin /> {data.name}
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>{data.tagline}</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
        <button className={`btn ${activeTab === 'explore' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('explore')}>
          <Info size={16} /> Overview & Nearby
        </button>
        <button className={`btn ${activeTab === 'food_activity' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('food_activity')}>
          <Utensils size={16} /> Food & Activities
        </button>
        <button className={`btn ${activeTab === 'roaming' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('roaming')}>
          <MapPin size={16} /> Best Roaming Places
        </button>
        <button className={`btn ${activeTab === 'stays' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('stays')}>
          <Home size={16} /> Where to Stay
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content" style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 24, borderRadius: 16 }}>
        
        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nearby Destinations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {data.nearby.map((loc, i) => (
                <div key={i} className="glass-card" style={{ padding: 16 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{loc.name}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>{loc.distance}</div>
                  <div style={{ color: 'var(--color-primary)', fontSize: '0.85rem', marginTop: 8 }}>{loc.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food & Activity Tab */}
        {activeTab === 'food_activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={20}/> Top Activities</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {data.activities.map((act, i) => (
                  <div key={i} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '2rem' }}>{act.emoji}</div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{act.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Best time: {act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Utensils size={20}/> Famous Local Food</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {data.food.map((item, i) => (
                  <div key={i} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '2rem' }}>{item.emoji}</div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Try at: {item.place}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Roaming Places Tab */}
        {activeTab === 'roaming' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button className={`badge ${roamingCategory === 'family' ? 'badge-info' : ''}`} onClick={() => setRoamingCategory('family')}>👪 Family</button>
              <button className={`badge ${roamingCategory === 'friends' ? 'badge-info' : ''}`} onClick={() => setRoamingCategory('friends')}>👯 Friends</button>
              <button className={`badge ${roamingCategory === 'partner' ? 'badge-info' : ''}`} onClick={() => setRoamingCategory('partner')}>❤️ Partner</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.roaming[roamingCategory].map((place, i) => (
                <div key={i} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 8 }}>{place.name}</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{place.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stays Tab */}
        {activeTab === 'stays' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <StayCategory title="Hotels" icon={<Hotel size={20}/>} items={data.stays.hotels} />
            <StayCategory title="PGs" icon={<Building size={20}/>} items={data.stays.pgs} />
            <StayCategory title="Lodges" icon={<Home size={20}/>} items={data.stays.lodges} />
            <StayCategory title="Dormitories" icon={<Bed size={20}/>} items={data.stays.dormitories} />
          </div>
        )}

      </div>
    </div>
  );
}

function StayCategory({ title, icon, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.map((stay, i) => (
          <div key={i} className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{stay.name}</div>
              <div className="badge badge-success">⭐ {stay.rating}</div>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>{stay.amenities}</div>
            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginTop: 12 }}>{stay.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
