import { Heart } from 'lucide-react';
import { useState } from 'react';

/**
 * ListingCard — Universal card component used across:
 * Vehicles, Stays, Packages, Rentals, Food listings.
 *
 * Props:
 *  - title: string
 *  - description: string (1-2 lines)
 *  - price: number | string (displayed as ₹X)
 *  - priceUnit: string (e.g. '/km', '/night', '/day')
 *  - rating: number (e.g. 8.6) — Agoda-style badge
 *  - ratingCount: number (e.g. 124)
 *  - emoji: string (emoji icon when no image)
 *  - imageUrl: string (optional)
 *  - badge: string (e.g. "12% cheaper" — ComparisonStrip)
 *  - onClick: fn
 *  - ctaLabel: string (default "Book Now")
 *  - onCta: fn
 */
export default function ListingCard({
  title,
  description,
  price,
  priceUnit = '',
  rating,
  ratingCount,
  emoji = '🚗',
  imageUrl,
  badge,
  onClick,
  ctaLabel = 'Book Now',
  onCta,
  style = {},
}) {
  const [saved, setSaved] = useState(false);

  const handleCta = (e) => {
    e.stopPropagation();
    if (onCta) onCta();
    else if (onClick) onClick();
  };

  const handleHeart = (e) => {
    e.stopPropagation();
    setSaved(s => !s);
  };

  const displayPrice = typeof price === 'number' ? `₹${price.toLocaleString('en-IN')}` : price;

  return (
    <div className="listing-card" onClick={onClick} style={style}>
      {/* Image or emoji placeholder */}
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="listing-card-image" loading="lazy" />
      ) : (
        <div className="listing-card-image-placeholder">{emoji}</div>
      )}

      {/* Rating badge — Agoda style, top-left */}
      {rating != null && (
        <div className="listing-rating-badge">{Number(rating).toFixed(1)}</div>
      )}

      <div className="listing-card-body">
        <div className="listing-card-header">
          <div className="listing-card-title">{title}</div>
          <button
            className={`listing-card-heart${saved ? ' saved' : ''}`}
            onClick={handleHeart}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            <Heart size={16} fill={saved ? '#f43f5e' : 'none'} />
          </button>
        </div>

        {description && (
          <div className="listing-card-desc">{description}</div>
        )}

        {ratingCount != null && (
          <div className="listing-rating-count">{ratingCount} reviews</div>
        )}

        {/* ComparisonStrip — Trivago style */}
        {badge && (
          <div className="comparison-strip">
            🏷️ {badge}
          </div>
        )}

        <div className="listing-card-footer">
          <div className="listing-card-price">
            {displayPrice}
            {priceUnit && <span>{priceUnit}</span>}
          </div>
          {ctaLabel && (
            <button
              className="btn btn-sm btn-primary"
              onClick={handleCta}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
