/**
 * EarningsChart.jsx
 * A self-contained SVG bar chart for earnings/trips visualization.
 * No external charting library needed.
 */
import { useState } from 'react';

const PERIODS = ['7D', '30D', '3M', '1Y'];

function generateMockData(period, seed = 1) {
  const points = { '7D': 7, '30D': 30, '3M': 12, '1Y': 12 }[period];
  return Array.from({ length: points }, (_, i) => {
    const base = seed * 800 + Math.sin(i * 0.8 + seed) * 400;
    return Math.max(100, Math.round(base + Math.random() * 600));
  });
}

function getLabels(period) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (period === '7D')  return days;
  if (period === '30D') return Array.from({ length: 30 }, (_, i) => `${i + 1}`);
  if (period === '3M')  return months.slice(0, 12);
  return months;
}

export default function EarningsChart({ seed = 1, color = '#1b998b', label = 'Earnings (₹)' }) {
  const [period, setPeriod] = useState('7D');
  const [hovered, setHovered] = useState(null);

  const data   = generateMockData(period, seed);
  const labels = getLabels(period);
  const max    = Math.max(...data);
  const total  = data.reduce((a, b) => a + b, 0);
  const avg    = Math.round(total / data.length);

  const W = 580, H = 180, PAD = 10;
  const barW = Math.min(32, (W - PAD * 2) / data.length - 4);

  return (
    <div>
      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
              background: period === p ? color : 'var(--color-surface)',
              color: period === p ? '#fff' : 'var(--color-text-tertiary)',
              border: period === p ? `1px solid ${color}` : '1px solid var(--color-border)',
              cursor: 'pointer',
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>
            ₹{total.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Total ({period})</div>
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
            ₹{avg.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Average</div>
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>
            ₹{Math.max(...data).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>Best day</div>
        </div>
      </div>

      {/* SVG chart */}
      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H + 24}`}
          style={{ width: '100%', minWidth: 280, display: 'block' }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Y grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <line key={f}
              x1={PAD} y1={H - f * H} x2={W - PAD} y2={H - f * H}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}
            />
          ))}

          {/* Bars */}
          {data.map((val, i) => {
            const barH   = Math.max(4, (val / max) * (H - 8));
            const x      = PAD + i * ((W - PAD * 2) / data.length) + 2;
            const y      = H - barH;
            const isHov  = hovered === i;

            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background bar */}
                <rect x={x} y={0} width={barW} height={H}
                  fill="rgba(255,255,255,0.02)" rx={4}
                />
                {/* Value bar */}
                <rect x={x} y={y} width={barW} height={barH}
                  fill={isHov ? '#17d9c9' : color}
                  rx={4}
                  opacity={isHov ? 1 : 0.75}
                />
                {/* Tooltip */}
                {isHov && (
                  <g>
                    <rect x={x - 14} y={y - 28} width={barW + 28} height={22} rx={4} fill="rgba(0,0,0,0.85)" />
                    <text x={x + barW / 2} y={y - 13} textAnchor="middle"
                      fill="#fff" fontSize={10} fontWeight="700">
                      ₹{val.toLocaleString('en-IN')}
                    </text>
                  </g>
                )}
                {/* X label — only show some to avoid clutter */}
                {(data.length <= 12 || i % Math.ceil(data.length / 7) === 0) && (
                  <text x={x + barW / 2} y={H + 16} textAnchor="middle"
                    fill="rgba(255,255,255,0.35)" fontSize={9}>
                    {labels[i]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
