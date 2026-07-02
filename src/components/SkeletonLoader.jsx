import React from 'react';

export default function SkeletonLoader({ type = 'default', count = 1, className = '', style = {} }) {
  const renderSkeleton = (index) => {
    switch (type) {
      case 'stats-card':
      case 'card':
        return (
          <div
            key={index}
            className={`skeleton-card shimmer ${className}`}
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              ...style
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            </div>
            <div className="skeleton-box" style={{ width: '60%', height: '28px', borderRadius: '6px', marginTop: '4px' }} />
            <div className="skeleton-box" style={{ width: '30%', height: '12px', borderRadius: '4px' }} />
          </div>
        );

      case 'list':
      case 'booking-list':
        return (
          <div
            key={index}
            className={`skeleton-list-item shimmer ${className}`}
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '12px',
              ...style
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-box" style={{ width: '50%', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="skeleton-box" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <div className="skeleton-box" style={{ width: '25%', height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '90px', height: '32px', borderRadius: '8px' }} />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div
            key={index}
            className={`skeleton-profile shimmer ${className}`}
            style={{
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              ...style
            }}
          >
            <div className="skeleton-box" style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              <div className="skeleton-box" style={{ width: '40%', height: '20px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '30%', height: '12px', borderRadius: '4px' }} />
            </div>
          </div>
        );

      case 'table':
        return (
          <div
            key={index}
            className={`skeleton-table shimmer ${className}`}
            style={{
              width: '100%',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              overflow: 'hidden',
              ...style
            }}
          >
            <div style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.03)', display: 'flex', gap: '16px' }}>
              <div className="skeleton-box" style={{ width: '20%', height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '30%', height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '25%', height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '25%', height: '16px', borderRadius: '4px' }} />
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} style={{ padding: '16px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', gap: '16px' }}>
                <div className="skeleton-box" style={{ width: '20%', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '25%', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '25%', height: '14px', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        );

      case 'page':
      default:
        return (
          <div
            key={index}
            className={`skeleton-page shimmer ${className}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0', ...style }}
          >
            <div className="skeleton-box" style={{ width: '200px', height: '28px', borderRadius: '6px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', minHeight: '100px' }}>
                  <div className="skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
                  <div className="skeleton-box" style={{ width: '60%', height: '24px', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
            <div className="skeleton-box" style={{ width: '150px', height: '22px', borderRadius: '4px', marginTop: '12px' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="skeleton-box" style={{ width: '40%', height: '18px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="skeleton-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </div>
  );
}
