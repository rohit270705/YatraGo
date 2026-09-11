import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Filter, Calendar, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { useWalletStore, useAuthStore } from '../store';
import DashboardHeader from '../components/DashboardHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const TIME_FILTERS = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
const CATEGORY_COLORS = {
  'Transit (Flight/Train/Ferry)': 'var(--color-accent-teal)',
  'Stay/Hotel': 'var(--color-accent-blue)',
  'Rentals': 'var(--color-accent-amber)',
  'Packages': 'var(--color-accent-purple)',
  'Parcel': 'var(--color-accent-green)',
  'Other': 'var(--color-text-tertiary)',
};

export default function SpendingAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { transactions } = useWalletStore();
  
  const [timeFilter, setTimeFilter] = useState('Monthly');

  // Categorization logic based on transaction description
  const getCategory = (desc = '') => {
    const d = desc.toLowerCase();
    if (d.includes('flight') || d.includes('train') || d.includes('ferry') || d.includes('ticket')) return 'Transit (Flight/Train/Ferry)';
    if (d.includes('stay') || d.includes('hotel') || d.includes('homestay')) return 'Stay/Hotel';
    if (d.includes('rental') || d.includes('bike') || d.includes('scooty') || d.includes('vehicle')) return 'Rentals';
    if (d.includes('package')) return 'Packages';
    if (d.includes('parcel')) return 'Parcel';
    return 'Other';
  };

  // Process data for charts
  const { timeSeriesData, categoryData, totalSpent } = useMemo(() => {
    if (!transactions) return { timeSeriesData: [], categoryData: [], totalSpent: 0 };

    // Filter only debits (spending)
    const spendingTxns = transactions.filter(t => t.amount < 0 && t.type !== 'WITHDRAWAL');

    let total = 0;
    const categoryMap = {};
    const timeMap = {};

    spendingTxns.forEach(t => {
      const amount = Math.abs(t.amount);
      total += amount;

      // Category aggregation
      const cat = getCategory(t.description);
      categoryMap[cat] = (categoryMap[cat] || 0) + amount;

      // Time aggregation
      const date = new Date(t.created_at || t.date); // Handle both formats
      let timeKey = '';

      if (timeFilter === 'Weekly') {
        // Simple week bucket (e.g., "Week 34")
        const week = Math.ceil(date.getDate() / 7);
        timeKey = `${date.toLocaleString('default', { month: 'short' })} W${week}`;
      } else if (timeFilter === 'Monthly') {
        timeKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      } else if (timeFilter === 'Quarterly') {
        const q = Math.ceil((date.getMonth() + 1) / 3);
        timeKey = `Q${q} ${date.getFullYear()}`;
      } else if (timeFilter === 'Yearly') {
        timeKey = `${date.getFullYear()}`;
      }

      timeMap[timeKey] = (timeMap[timeKey] || 0) + amount;
    });

    const categoryData = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key],
    })).sort((a, b) => b.value - a.value);

    // Sort time data chronologically
    const timeSeriesData = Object.keys(timeMap).map(key => ({
      time: key,
      amount: timeMap[key],
    }));
    // Note: A robust chronological sort requires parsing the timeKey back to dates, 
    // but for this demo, we'll assume basic sorting works for Year/Month strings or keep insertion order.
    // Reversing usually gives older to newer if transactions are ordered newest first.
    timeSeriesData.reverse(); 

    return { timeSeriesData, categoryData, totalSpent: total };
  }, [transactions, timeFilter]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--color-surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{label}</p>
          <p style={{ margin: 0, color: payload[0].fill || 'var(--color-accent-teal)' }}>
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <DashboardHeader subtitle={`Spending Analytics — ${user?.name || 'Traveller'}`} />
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 12, paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1><TrendingUp size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Spending Analytics</h1>
          <p>Track and visualize your travel expenses</p>
        </div>
        
        <div style={{ background: 'var(--color-surface-hover)', padding: '4px', borderRadius: 'var(--radius-md)', display: 'flex' }}>
          {TIME_FILTERS.map(filter => (
            <button
              key={filter}
              className={`btn btn-sm ${timeFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setTimeFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-card-icon teal"><Activity size={20} /></div>
          <div className="stat-card-label">Total Spent ({timeFilter})</div>
          <div className="stat-card-value">₹{totalSpent.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><PieChartIcon size={20} /></div>
          <div className="stat-card-label">Top Category</div>
          <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>
            {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><Calendar size={20} /></div>
          <div className="stat-card-label">Transactions Count</div>
          <div className="stat-card-value">
            {transactions.filter(t => t.amount < 0 && t.type !== 'WITHDRAWAL').length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6" style={{ marginBottom: 'var(--space-2xl)' }}>
        
        {/* Time Series Chart */}
        <div className="glass-card animate-slide-up stagger-1" style={{ padding: 24, minHeight: 400 }}>
          <h3 style={{ marginBottom: 24, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} /> Spending Trend ({timeFilter})
          </h3>
          {timeSeriesData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
                         tickFormatter={(val) => `₹${val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-hover)' }} />
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ height: 320, padding: 0 }}>
              <div className="empty-state-icon"><Filter size={32} /></div>
              <p>No spending data available for this view.</p>
            </div>
          )}
        </div>

        {/* Category Breakdown Chart */}
        <div className="glass-card animate-slide-up stagger-2" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: 24, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChartIcon size={18} /> Spending Breakdown
          </h3>
          
          {categoryData.length > 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Other']} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryData.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS['Other'] }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>₹{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon" style={{ opacity: 0.5 }}><PieChartIcon size={32} /></div>
              <p>No categories to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
