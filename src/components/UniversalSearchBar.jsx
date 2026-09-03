import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search, Car, Home, Bus, UtensilsCrossed, Package, Sparkles } from 'lucide-react';
import { useChatStore } from '../store';

const TABS = [
  { id: 'vehicles', label: 'Vehicles', icon: Car, placeholder: 'Where are you going?', sub: 'From' },
  { id: 'stays',    label: 'Stays',    icon: Home, placeholder: 'Search homestays & hotels', sub: 'Destination' },
  { id: 'transit',  label: 'Bus / Train', icon: Bus, placeholder: 'E.g. Mumbai to Pune', sub: 'Route' },
  { id: 'food',     label: 'Food',     icon: UtensilsCrossed, placeholder: 'Search local cuisine & restaurants', sub: 'Area' },
  { id: 'parcel',   label: 'Parcel',   icon: Package, placeholder: 'Send a parcel — enter destination', sub: 'To' },
];

const YAARA_TRIGGERS = ['plan me', 'find me', 'book me', 'suggest', 'recommend', 'what is', 'best place'];

export default function UniversalSearchBar({ onSearch }) {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();
  const { toggleChat, sendUserMessage } = useChatStore();

  const tab = TABS.find(t => t.id === activeTab);
  const isYaaraQuery = YAARA_TRIGGERS.some(t => from.toLowerCase().startsWith(t) || to.toLowerCase().startsWith(t));

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isYaaraQuery) {
      const query = from || to;
      toggleChat();
      setTimeout(() => sendUserMessage(query), 400);
      return;
    }
    if (onSearch) {
      onSearch({ tab: activeTab, from, to, date });
      return;
    }
    // Default routing
    switch (activeTab) {
      case 'vehicles': navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`); break;
      case 'stays':    navigate(`/host`); break;
      case 'transit':  navigate(`/search?q=${encodeURIComponent(to)}`); break;
      case 'food':     navigate(`/search?type=food&area=${encodeURIComponent(from)}`); break;
      case 'parcel':   navigate('/parcel'); break;
      default:         navigate('/search');
    }
  };

  const handleYaaraClick = () => {
    toggleChat();
    setTimeout(() => sendUserMessage('Plan me a trip'), 400);
  };

  return (
    <div className="usb-wrapper animate-slide-up">
      {/* Tab switcher */}
      <div className="usb-tabs">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`usb-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit}>
        <div className="usb-input-row">
          {/* From / Main field */}
          <div className="usb-field" style={{ flex: 2 }}>
            <MapPin size={16} className="usb-field-icon" />
            <input
              type="text"
              placeholder={activeTab === 'vehicles' ? 'From city or area' : tab?.placeholder}
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>

          {/* To field — only for vehicles and transit */}
          {(activeTab === 'vehicles' || activeTab === 'transit') && (
            <div className="usb-field" style={{ flex: 2 }}>
              <MapPin size={16} className="usb-field-icon" />
              <input
                type="text"
                placeholder="To city or area"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>
          )}

          {/* Date field */}
          <div className="usb-field" style={{ flex: 1, minWidth: '130px' }}>
            <Calendar size={16} className="usb-field-icon" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <button type="submit" className="usb-search-btn">
            {isYaaraQuery ? <Sparkles size={16} /> : <Search size={16} />}
            {isYaaraQuery ? 'Ask Yaara' : 'Search'}
          </button>
        </div>
      </form>

      {/* Yaara hint */}
      <div className="usb-yaara-hint">
        <Sparkles size={12} style={{ color: 'var(--color-accent-purple)' }} />
        <span>Try natural language:</span>
        <button className="usb-yaara-chip" onClick={handleYaaraClick}>✨ Plan me 3 days in Goa</button>
        <button className="usb-yaara-chip" onClick={() => { toggleChat(); setTimeout(() => sendUserMessage('Find me a budget trip to Coorg for 2'), 400); }}>
          🏕️ Budget trip to Coorg
        </button>
      </div>
    </div>
  );
}
