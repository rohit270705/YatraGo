import { useState, useEffect } from 'react';
import { UtensilsCrossed, MapPin, IndianRupee, Star, ChefHat } from 'lucide-react';
import { useFoodStore } from '../store';

export default function FoodDiscovery({ destination }) {
  const { cuisines, fetchCuisines, isLoading } = useFoodStore();

  useEffect(() => {
    if (destination) {
      fetchCuisines(destination);
    }
  }, [destination, fetchCuisines]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
      </div>
    );
  }

  if (!cuisines || cuisines.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <UtensilsCrossed size={22} color="var(--color-primary)" />
          <h3 style={{ margin: 0 }}>Local Food Discovery</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <ChefHat size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {destination
              ? `Food recommendations for ${destination} will appear here once added by hosts and admins.`
              : 'Select a destination to discover local cuisines!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <UtensilsCrossed size={22} color="var(--color-primary)" />
        <h3 style={{ margin: 0 }}>Must-Try Local Dishes</h3>
        <span style={{ fontSize: '0.75rem', background: 'var(--color-primary)', color: 'white', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
          {cuisines.length} dishes
        </span>
      </div>

      {/* Platform-curated dishes (no host_recommendation_id) */}
      {cuisines.filter(d => !d.host_recommendation_id).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🍽️ Famous Local Dishes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {cuisines.filter(d => !d.host_recommendation_id).map(dish => renderDishCard(dish))}
          </div>
        </div>
      )}

      {/* Host-recommended dishes (have host_recommendation_id) */}
      {cuisines.filter(d => d.host_recommendation_id).length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⭐ Recommended by Local Hosts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {cuisines.filter(d => d.host_recommendation_id).map(dish => renderDishCard(dish))}
          </div>
        </div>
      )}

      {/* If all dishes are platform-curated and no host recommendations yet */}
      {cuisines.filter(d => d.host_recommendation_id).length === 0 && cuisines.length > 0 && (
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(27,153,139,0.04)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          💡 Local host food recommendations will appear here once hosts are registered at this destination.
        </div>
      )}
    </div>
  );

  function renderDishCard(dish) {
    return (
      <div key={dish.id} style={{ 
            background: 'var(--color-surface)', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {dish.image_url && (
              <div style={{ height: 140, overflow: 'hidden' }}>
                <img src={dish.image_url} alt={dish.dish_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ padding: 16 }}>
              <h4 style={{ fontSize: '1rem', marginBottom: 6 }}>{dish.dish_name}</h4>
              
              {dish.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {dish.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dish.price_range && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-accent-green)', fontWeight: 600 }}>
                    <IndianRupee size={12} /> {dish.price_range}
                  </span>
                )}
                {dish.eatery_name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    <MapPin size={12} /> {dish.eatery_name}
                  </span>
                )}
              </div>

              {dish.host_recommendation_id && (
                <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={12} /> Host Recommended
                </div>
              )}
            </div>
          </div>
    );
  }
}
